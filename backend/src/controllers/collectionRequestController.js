const { CollectionRequest, User, Vehicle, Notification, AuditLog } = require('../models');
const { getIO } = require('../sockets/socketHandler');

// @desc    Citizen: Create on-demand or special-event collection request
// @route   POST /api/v1/collection-requests
// @access  Private (Citizen, Admin)
exports.createRequest = async (req, res, next) => {
  try {
    const {
      requestType = 'ON_DEMAND',
      category = 'RECYCLABLE',
      estimatedVolumeKg = 5,
      description,
      pickupAddress,
      wardName,
      coordinates,
      eventDetails,
    } = req.body;

    if (!pickupAddress || !wardName) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide pickup address and Srinagar ward name.' },
      });
    }

    let locationCoords = [74.7973, 34.0837];
    if (coordinates) {
      if (typeof coordinates === 'string') {
        try {
          locationCoords = JSON.parse(coordinates);
        } catch {
          locationCoords = coordinates.split(',').map((n) => parseFloat(n.trim()));
        }
      } else if (Array.isArray(coordinates)) {
        locationCoords = coordinates;
      }
    } else if (req.user.location?.coordinates) {
      locationCoords = req.user.location.coordinates;
    }

    const request = await CollectionRequest.create({
      userId: req.user.id,
      requestType,
      category,
      estimatedVolumeKg: parseFloat(estimatedVolumeKg) || 5,
      description,
      pickupAddress: pickupAddress.trim(),
      wardName: wardName.trim(),
      location: {
        type: 'Point',
        coordinates: locationCoords,
      },
      eventDetails: requestType === 'EVENT' ? eventDetails : undefined,
      status: 'REQUESTED',
    });

    // Real-time alert to municipal admins
    try {
      const io = getIO();
      io.to('admin_room').emit('new_collection_request', {
        requestId: request._id,
        citizenName: req.user.name,
        wardName: request.wardName,
        requestType: request.requestType,
        category: request.category,
        estimatedVolumeKg: request.estimatedVolumeKg,
        createdAt: request.createdAt,
      });
    } catch {
      // Socket not ready
    }

    res.status(201).json({
      success: true,
      message: 'Collection request registered successfully.',
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: List all collection requests with filters & pagination
// @route   GET /api/v1/collection-requests
// @access  Private (Admin, Super Admin)
exports.getRequests = async (req, res, next) => {
  try {
    const { status, wardName, requestType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (wardName) query.wardName = wardName;
    if (requestType) query.requestType = requestType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [requests, total] = await Promise.all([
      CollectionRequest.find(query)
        .populate('userId', 'name email phone')
        .populate('assignedDriverId', 'name phone')
        .populate('assignedVehicleId', 'plateNumber model vehicleId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      CollectionRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: View own collection requests
// @route   GET /api/v1/collection-requests/my
// @access  Private (Citizen)
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await CollectionRequest.find({ userId: req.user.id })
      .populate('assignedDriverId', 'name phone')
      .populate('assignedVehicleId', 'plateNumber model')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Approve, Reject, Assign Driver/Vehicle, Schedule request
// @route   PATCH /api/v1/collection-requests/:id/status
// @access  Private (Admin, Super Admin)
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status, assignedDriverId, assignedVehicleId, scheduledDate, cancellationReason } = req.body;
    const request = await CollectionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection request not found.' },
      });
    }

    const previousStatus = request.status;
    if (status) request.status = status;
    if (assignedDriverId) request.assignedDriverId = assignedDriverId;
    if (assignedVehicleId) request.assignedVehicleId = assignedVehicleId;
    if (scheduledDate) request.scheduledDate = scheduledDate;
    if (cancellationReason) request.cancellationReason = cancellationReason;

    if (status === 'COMPLETED') {
      request.completedAt = new Date();
    }

    await request.save();

    // Audit log
    await AuditLog.create({
      performedBy: req.user.id,
      targetUser: request.userId,
      action: 'COLLECTION_REQUEST_UPDATE',
      previousValue: previousStatus,
      newValue: status,
      reason: `Admin updated request status to ${status}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    // Notify citizen of update
    try {
      const io = getIO();
      io.to(`user_${request.userId}`).emit('collection_request_updated', {
        requestId: request._id,
        status: request.status,
        scheduledDate: request.scheduledDate,
      });

      await Notification.create({
        userId: request.userId,
        type: 'COLLECTION_STATUS',
        title: `Collection Request ${status}`,
        message: `Your waste collection request in ${request.wardName} is now ${status}.`,
        data: { requestId: request._id, status },
      });
    } catch {
      // Socket not ready
    }

    res.status(200).json({
      success: true,
      message: `Collection request updated to ${status}.`,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Cancel own request
// @route   DELETE /api/v1/collection-requests/:id
// @access  Private (Citizen)
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await CollectionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection request not found.' },
      });
    }

    // Ownership check
    if (request.userId.toString() !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to cancel this request.' },
      });
    }

    if (request.status === 'IN_PROGRESS' || request.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Cannot cancel an in-progress or completed collection.' },
      });
    }

    request.status = 'CANCELLED';
    request.cancellationReason = req.body.reason || 'Cancelled by citizen';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Collection request cancelled.',
      data: request,
    });
  } catch (err) {
    next(err);
  }
};
