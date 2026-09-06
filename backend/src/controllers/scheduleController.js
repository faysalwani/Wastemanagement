const { CollectionSchedule, Vehicle, User } = require('../models');

// @desc    Get collection schedules (Filterable by ward)
// @route   GET /api/v1/collection-schedules
// @access  Public
exports.getSchedules = async (req, res, next) => {
  try {
    const { wardName } = req.query;
    const query = { isActive: true };
    if (wardName) query.wardName = wardName;

    const schedules = await CollectionSchedule.find(query)
      .populate('assignedVehicleId', 'plateNumber model vehicleId')
      .populate('assignedDriverId', 'name phone')
      .sort({ wardName: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Create recurring collection schedule for a ward
// @route   POST /api/v1/collection-schedules
// @access  Private (Admin, Super Admin)
exports.createSchedule = async (req, res, next) => {
  try {
    const {
      wardName,
      category = 'MIXED',
      collectionDays,
      timeWindow,
      assignedVehicleId,
      assignedDriverId,
      frequencyDescription,
    } = req.body;

    if (!wardName || !collectionDays || !Array.isArray(collectionDays)) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide wardName and collectionDays array.' },
      });
    }

    const schedule = await CollectionSchedule.create({
      wardName: wardName.trim(),
      category,
      collectionDays,
      timeWindow: timeWindow || { start: '07:00', end: '11:00' },
      assignedVehicleId: assignedVehicleId || undefined,
      assignedDriverId: assignedDriverId || undefined,
      frequencyDescription: frequencyDescription || 'Scheduled Municipal Waste Sweep',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Collection schedule created for ward ${schedule.wardName}.`,
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Update collection schedule
// @route   PATCH /api/v1/collection-schedules/:id
// @access  Private (Admin, Super Admin)
exports.updateSchedule = async (req, res, next) => {
  try {
    const schedule = await CollectionSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection schedule not found.' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully.',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Delete/deactivate collection schedule
// @route   DELETE /api/v1/collection-schedules/:id
// @access  Private (Admin, Super Admin)
exports.deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await CollectionSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Collection schedule not found.' },
      });
    }

    schedule.isActive = false;
    await schedule.save();

    res.status(200).json({
      success: true,
      message: 'Collection schedule deactivated.',
    });
  } catch (err) {
    next(err);
  }
};
