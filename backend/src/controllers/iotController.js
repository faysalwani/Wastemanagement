const { SmartBin, SensorReading } = require('../models');
const { getIO } = require('../sockets/socketHandler');

// @desc    Ingest real-time telematics from ESP32 or Virtual Fleet Simulator
// @route   POST /api/v1/iot/telemetry
// @access  Device Authenticated (X-Device-Token)
exports.ingestTelemetry = async (req, res, next) => {
  try {
    const rawToken = req.headers['x-device-token'];
    const { binId, rawDistanceCm, weightKg, temperatureC, batteryPercent } = req.body;

    if (!binId || rawDistanceCm === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide binId and rawDistanceCm.' },
      });
    }

    // Find bin
    const bin = await SmartBin.findOne({ binId: binId.toUpperCase() }).select('+deviceToken +deviceTokenHash');

    if (!bin) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: `Smart bin ${binId} not registered in system.` },
      });
    }

    // Authenticate token if configured
    if (bin.deviceTokenHash && rawToken) {
      const computedHash = SmartBin.verifyDeviceToken(rawToken);
      if (computedHash !== bin.deviceTokenHash && rawToken !== bin.deviceToken) {
        return res.status(401).json({
          success: false,
          error: { code: 401, message: 'Invalid device authentication token.' },
        });
      }
    }

    // Calculate fill percentage based on physical bin depth
    const fillPercent = bin.calculateFillFromDistance(parseFloat(rawDistanceCm));

    // Update bin state
    bin.currentFillPercent = fillPercent;
    if (weightKg !== undefined) bin.currentWeightKg = Math.max(0, parseFloat(weightKg));
    if (temperatureC !== undefined) bin.currentTemperatureC = parseFloat(temperatureC);
    if (batteryPercent !== undefined) bin.batteryPercent = Math.min(100, Math.max(0, parseFloat(batteryPercent)));

    bin.lastSeen = new Date();
    bin.updateOperationalStatus();
    await bin.save();

    // Log time-series sensor reading
    const reading = await SensorReading.create({
      binId: bin.binId,
      fillPercent,
      rawDistanceCm: parseFloat(rawDistanceCm),
      weightKg: bin.currentWeightKg,
      temperatureC: bin.currentTemperatureC,
      batteryPercent: bin.batteryPercent,
      recordedAt: new Date(),
    });

    // Broadcast real-time telemetry update over WebSocket
    try {
      const io = getIO();
      io.emit('smartbin_telemetry_updated', {
        binId: bin.binId,
        name: bin.name,
        wardName: bin.wardName,
        fillPercent: bin.currentFillPercent,
        weightKg: bin.currentWeightKg,
        temperatureC: bin.currentTemperatureC,
        batteryPercent: bin.batteryPercent,
        status: bin.status,
        location: bin.location,
        lastSeen: bin.lastSeen,
      });
    } catch (wsErr) {
      // Ignore if socket not ready
    }

    res.status(200).json({
      success: true,
      message: 'Telemetry ingested successfully.',
      data: {
        binId: bin.binId,
        fillPercent,
        status: bin.status,
        timestamp: bin.lastSeen,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all smart bins with status and telemetry
// @route   GET /api/v1/iot/bins
// @access  Public / Admin
exports.getBins = async (req, res, next) => {
  try {
    const { wardName, status } = req.query;
    const query = { isActive: true };

    if (wardName) query.wardName = wardName;
    if (status) query.status = status;

    const bins = await SmartBin.find(query).sort({ currentFillPercent: -1 });

    // Compute active online vs stale status (stale if no packet for > 15 minutes)
    const now = Date.now();
    const formatted = bins.map((b) => {
      const diffMin = (now - new Date(b.lastSeen).getTime()) / (1000 * 60);
      let connectionStatus = 'ONLINE';
      if (diffMin > 30) connectionStatus = 'OFFLINE';
      else if (diffMin > 10) connectionStatus = 'STALE';

      return {
        _id: b._id,
        binId: b.binId,
        name: b.name,
        wardName: b.wardName,
        address: b.address,
        location: b.location,
        capacityLiters: b.capacityLiters,
        depthCm: b.depthCm,
        currentFillPercent: b.currentFillPercent,
        currentWeightKg: b.currentWeightKg,
        currentTemperatureC: b.currentTemperatureC,
        batteryPercent: b.batteryPercent,
        status: b.status,
        connectionStatus,
        lastSeen: b.lastSeen,
        fillThresholds: b.fillThresholds,
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get historical time-series sensor readings for a bin
// @route   GET /api/v1/iot/bins/:binId/history
// @access  Public / Admin
exports.getBinHistory = async (req, res, next) => {
  try {
    const { binId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 30;

    const readings = await SensorReading.find({ binId: binId.toUpperCase() })
      .sort({ recordedAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      binId: binId.toUpperCase(),
      count: readings.length,
      data: readings.reverse(), // chronological order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Register a new smart bin & generate device token
// @route   POST /api/v1/iot/bins
// @access  Private (Admin)
exports.createBin = async (req, res, next) => {
  try {
    const { binId, name, wardName, address, coordinates, depthCm, capacityLiters } = req.body;

    if (!binId || !name || !wardName || !coordinates) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide binId, name, wardName, and coordinates.' },
      });
    }

    const bin = new SmartBin({
      binId: binId.toUpperCase().trim(),
      name: name.trim(),
      wardName: wardName.trim(),
      address: address ? address.trim() : 'Srinagar, J&K',
      location: { type: 'Point', coordinates },
      depthCm: depthCm || 100,
      capacityLiters: capacityLiters || 240,
    });

    const rawToken = bin.generateDeviceToken();
    await bin.save();

    res.status(201).json({
      success: true,
      message: 'Smart Bin provisioned successfully.',
      deviceToken: rawToken, // Displayed once to admin for flashing onto ESP32
      data: bin,
    });
  } catch (err) {
    next(err);
  }
};
