const { CollectionRun, Vehicle, SmartBin, CollectionRequest, User, AuditLog } = require('../models');
const { getIO } = require('../sockets/socketHandler');

// @desc    Admin: Dispatch an optimized route manifest to vehicle & driver
// @route   POST /api/v1/collection-runs/dispatch
// @access  Private (Admin, Super Admin)
exports.dispatchRoute = async (req, res, next) => {
  try {
    const {
      vehicleId,
      driverId,
      wardName = 'All Wards',
      stops,
      totalDistanceKm = 0,
      estimatedDurationMinutes = 0,
    } = req.body;

    if (!vehicleId || !driverId || !stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide vehicleId, driverId, and at least one collection stop.' },
      });
    }

    // Verify Vehicle & Driver exist
    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(vehicleId),
      User.findOne({ _id: driverId, role: 'DRIVER' }),
    ]);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Selected vehicle not found.' },
      });
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Selected driver account not found.' },
      });
    }

    // Check for conflicting active runs on either vehicle or driver
    const existingConflict = await CollectionRun.findOne({
      $or: [{ vehicleId }, { driverId }],
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    });

    if (existingConflict) {
      const conflictMsg =
        existingConflict.driverId.toString() === driverId.toString()
          ? `Driver ${driver.name} already has an active collection run (${existingConflict.runId}).`
          : `Vehicle ${vehicle.plateNumber} is already assigned to an active collection run (${existingConflict.runId}).`;

      return res.status(409).json({
        success: false,
        error: { code: 409, message: conflictMsg },
      });
    }

    // Format stops for document schema
    const formattedStops = stops.map((s, index) => ({
      stopSequence: index + 1,
      type: s.type || 'SMART_BIN',
      refId: s.refId || s.id || s._id || null,
      refModel: s.type === 'COLLECTION_REQUEST' ? 'CollectionRequest' : s.type === 'SMART_BIN' ? 'SmartBin' : null,
      identifier: s.identifier || `STOP-${index + 1}`,
      name: s.name || `Collection Point ${index + 1}`,
      wardName: s.wardName || wardName,
      address: s.address || 'Srinagar, J&K',
      location: {
        type: 'Point',
        coordinates: s.coordinates,
      },
      fillPercent: s.fillPercent || 0,
      estimatedWeightKg: s.estimatedWeightKg || 0,
      priority: s.priority || 'MEDIUM',
      status: 'PENDING',
    }));

    const runId = `RUN-${Date.now().toString().slice(-6)}`;

    const collectionRun = await CollectionRun.create({
      runId,
      vehicleId: vehicle._id,
      driverId: driver._id,
      wardName,
      status: 'ASSIGNED',
      stops: formattedStops,
      totalStops: formattedStops.length,
      completedStops: 0,
      skippedStops: 0,
      totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
      estimatedDurationMinutes: Math.round(estimatedDurationMinutes),
      createdBy: req.user.id,
    });

    // Update vehicle status
    vehicle.driverId = driver._id;
    vehicle.status = 'AVAILABLE'; // Ready for driver to initiate
    await vehicle.save();

    // Audit log
    await AuditLog.create({
      performedBy: req.user.id,
      targetUser: driver._id,
      action: 'ROUTE_DISPATCH',
      previousValue: 'NONE',
      newValue: runId,
      reason: `Admin dispatched ${formattedStops.length}-stop collection route to ${driver.name}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    // Real-time broadcast to driver via WebSocket
    try {
      const io = getIO();
      io.to(`user_${driver._id}`).emit('new_route_dispatched', {
        runId,
        stopsCount: formattedStops.length,
        totalDistanceKm,
        dispatchedAt: collectionRun.createdAt,
      });
      io.to('admin_room').emit('route_dispatched_admin_update', {
        runId,
        driverName: driver.name,
        plateNumber: vehicle.plateNumber,
      });
    } catch {
      // Socket not ready
    }

    res.status(201).json({
      success: true,
      message: `Route successfully dispatched to driver ${driver.name}.`,
      data: collectionRun,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current active collection run (Driver gets their own; Admin gets all)
// @route   GET /api/v1/collection-runs/active
// @access  Private (Driver, Admin, Super Admin)
exports.getActiveRun = async (req, res, next) => {
  try {
    if (req.user.role === 'DRIVER') {
      const run = await CollectionRun.findOne({
        driverId: req.user.id,
        status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
      })
        .populate('vehicleId', 'vehicleId plateNumber model capacityKg status currentLocation')
        .populate('driverId', 'name phone');

      return res.status(200).json({
        success: true,
        data: run || null,
      });
    }

    // Admin & Super Admin: Get all currently active runs across the city
    const activeRuns = await CollectionRun.find({
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    })
      .populate('vehicleId', 'vehicleId plateNumber model capacityKg status currentLocation lastPing')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activeRuns.length,
      data: activeRuns,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Driver: Start assigned collection run & broadcast live status
// @route   PATCH /api/v1/collection-runs/:id/start
// @access  Private (Driver)
exports.startRun = async (req, res, next) => {
  try {
    const run = await CollectionRun.findById(req.params.id);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection run not found.' },
      });
    }

    if (run.driverId.toString() !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized. You are not assigned to this collection run.' },
      });
    }

    if (run.status === 'IN_PROGRESS') {
      return res.status(200).json({
        success: true,
        message: 'Collection run is already active.',
        data: run,
      });
    }

    if (run.status === 'COMPLETED' || run.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: `Cannot start a run that is already ${run.status}.` },
      });
    }

    run.status = 'IN_PROGRESS';
    run.startTime = new Date();
    await run.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(run.vehicleId, {
      status: 'COLLECTING',
      lastLocationUpdate: new Date(),
    });

    // Broadcast to Admin live map
    try {
      const io = getIO();
      io.to('admin_room').emit('collection_run_started', {
        runId: run.runId,
        driverId: req.user.id,
        driverName: req.user.name,
        vehicleId: run.vehicleId,
        startTime: run.startTime,
      });
    } catch {
      // Socket not ready
    }

    res.status(200).json({
      success: true,
      message: 'Collection run activated. Drive safely and follow your assigned route.',
      data: run,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Driver: Mark stop as Collected or Skipped (with mandatory reason)
// @route   PATCH /api/v1/collection-runs/:id/stops/:stopSequence
// @access  Private (Driver)
exports.updateStopStatus = async (req, res, next) => {
  try {
    const { status, skipReason, collectedWeightKg, driverNotes } = req.body;
    const stopSeq = parseInt(req.params.stopSequence, 10);

    const run = await CollectionRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection run not found.' },
      });
    }

    if (run.driverId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to modify this collection run.' },
      });
    }

    const stop = run.stops.find((s) => s.stopSequence === stopSeq);
    if (!stop) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: `Stop #${stopSeq} not found in this run manifest.` },
      });
    }

    if (status === 'SKIPPED' || status === 'UNABLE_TO_COLLECT') {
      if (!skipReason) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'A valid skip reason is required when a stop cannot be collected.' },
        });
      }
      stop.skipReason = skipReason;
    }

    stop.status = status;
    stop.completedAt = new Date();
    if (collectedWeightKg !== undefined && collectedWeightKg !== null) {
      stop.collectedWeightKg = parseFloat(collectedWeightKg);
    }
    if (driverNotes) stop.driverNotes = driverNotes.trim();

    // Recompute completed and skipped totals
    run.completedStops = run.stops.filter((s) => s.status === 'COLLECTED' || s.status === 'PARTIALLY_COLLECTED').length;
    run.skippedStops = run.stops.filter((s) => s.status === 'SKIPPED' || s.status === 'UNABLE_TO_COLLECT').length;
    await run.save();

    // If stop represents a smart bin, record physical collection event timestamp
    if (stop.type === 'SMART_BIN' && (status === 'COLLECTED' || status === 'PARTIALLY_COLLECTED')) {
      await SmartBin.findOneAndUpdate(
        { binId: stop.identifier.toUpperCase() },
        { lastCollectedAt: new Date() }
      );
    }

    // If stop represents a citizen collection request, transition request to COMPLETED
    if (stop.type === 'COLLECTION_REQUEST' && (status === 'COLLECTED' || status === 'PARTIALLY_COLLECTED')) {
      if (stop.refId) {
        await CollectionRequest.findByIdAndUpdate(stop.refId, {
          status: 'COMPLETED',
          completedAt: new Date(),
        });
      }
    }

    // Broadcast update to Admin hub
    try {
      const io = getIO();
      io.to('admin_room').emit('collection_stop_updated', {
        runId: run.runId,
        stopSequence: stopSeq,
        status,
        completedStops: run.completedStops,
        totalStops: run.totalStops,
      });
    } catch {
      // Socket not ready
    }

    res.status(200).json({
      success: true,
      message: `Stop #${stopSeq} marked as ${status}.`,
      data: {
        runId: run.runId,
        completedStops: run.completedStops,
        skippedStops: run.skippedStops,
        totalStops: run.totalStops,
        updatedStop: stop,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Driver: End active collection run & release vehicle
// @route   PATCH /api/v1/collection-runs/:id/end
// @access  Private (Driver)
exports.endRun = async (req, res, next) => {
  try {
    const run = await CollectionRun.findById(req.params.id);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection run not found.' },
      });
    }

    if (run.driverId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to end this collection run.' },
      });
    }

    run.status = 'COMPLETED';
    run.endTime = new Date();
    await run.save();

    // Release vehicle back to AVAILABLE
    await Vehicle.findByIdAndUpdate(run.vehicleId, {
      status: 'AVAILABLE',
      lastLocationUpdate: new Date(),
    });

    // Broadcast to Admin live map
    try {
      const io = getIO();
      io.to('admin_room').emit('collection_run_completed', {
        runId: run.runId,
        driverId: req.user.id,
        completedStops: run.completedStops,
        skippedStops: run.skippedStops,
        totalStops: run.totalStops,
        endTime: run.endTime,
      });
    } catch {
      // Socket not ready
    }

    res.status(200).json({
      success: true,
      message: 'Collection run completed successfully. Summary recorded.',
      data: run,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get historical collection runs (Driver gets own; Admin gets all with filters)
// @route   GET /api/v1/collection-runs/history
// @access  Private (Driver, Admin, Super Admin)
exports.getRunHistory = async (req, res, next) => {
  try {
    const { timeRange = 'all', driverId, page = 1, limit = 20 } = req.query;
    const query = { status: 'COMPLETED' };

    // Strict role partition
    if (req.user.role === 'DRIVER') {
      query.driverId = req.user.id;
    } else if (driverId) {
      query.driverId = driverId;
    }

    // Time range filter
    const now = new Date();
    if (timeRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.createdAt = { $gte: startOfDay };
    } else if (timeRange === 'this_week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: sevenDaysAgo };
    } else if (timeRange === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.createdAt = { $gte: startOfMonth };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [runs, total] = await Promise.all([
      CollectionRun.find(query)
        .populate('vehicleId', 'vehicleId plateNumber model capacityKg')
        .populate('driverId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      CollectionRun.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: runs.length,
      total,
      data: runs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get full details of a specific collection run
// @route   GET /api/v1/collection-runs/:id
// @access  Private (Driver, Admin, Super Admin)
exports.getRunById = async (req, res, next) => {
  try {
    const run = await CollectionRun.findById(req.params.id)
      .populate('vehicleId', 'vehicleId plateNumber model capacityKg status currentLocation')
      .populate('driverId', 'name phone email');

    if (!run) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection run not found.' },
      });
    }

    // Driver ownership check
    if (req.user.role === 'DRIVER' && run.driverId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to view this collection run.' },
      });
    }

    res.status(200).json({
      success: true,
      data: run,
    });
  } catch (err) {
    next(err);
  }
};
