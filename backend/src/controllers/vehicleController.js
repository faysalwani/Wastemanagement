const { Vehicle, User, AuditLog } = require('../models');

// @desc    Get all registered fleet vehicles
// @route   GET /api/v1/vehicles
// @access  Private (Admin, Driver, Super Admin)
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('driverId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Register a new fleet vehicle
// @route   POST /api/v1/vehicles
// @access  Private (Admin, Super Admin)
exports.createVehicle = async (req, res, next) => {
  try {
    const {
      plateNumber,
      vehicleId,
      model = 'Tata Ace Mini Compactor',
      capacityKg = 1000,
      vehicleType = 'MINI_COMPACTOR',
      driverId,
    } = req.body;

    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Vehicle plate/registration number is required.' },
      });
    }

    const assignedId = vehicleId || plateNumber;

    const existing = await Vehicle.findOne({
      $or: [{ plateNumber: plateNumber.toUpperCase() }, { vehicleId: assignedId.toUpperCase() }],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 409, message: 'A vehicle with this registration plate or ID already exists.' },
      });
    }

    const vehicle = await Vehicle.create({
      plateNumber: plateNumber.toUpperCase().trim(),
      vehicleNumber: plateNumber.toUpperCase().trim(),
      vehicleId: assignedId.toUpperCase().trim(),
      model: model.trim(),
      capacityKg: parseFloat(capacityKg) || 1000,
      vehicleType,
      driverId: driverId || undefined,
      status: 'AVAILABLE',
      isActive: true,
    });

    // Audit log
    await AuditLog.create({
      performedBy: req.user.id,
      action: 'VEHICLE_CREATED',
      newValue: vehicle.plateNumber,
      reason: `Admin registered new vehicle ${vehicle.plateNumber}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: `Vehicle ${vehicle.plateNumber} registered successfully.`,
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Update vehicle details or assign/unassign driver
// @route   PATCH /api/v1/vehicles/:id
// @access  Private (Admin, Super Admin)
exports.updateVehicle = async (req, res, next) => {
  try {
    const { model, capacityKg, vehicleType, status, driverId } = req.body;

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Vehicle not found.' },
      });
    }

    if (model) vehicle.model = model.trim();
    if (capacityKg !== undefined) vehicle.capacityKg = parseFloat(capacityKg);
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (status) vehicle.status = status;

    // Handle driver assignment
    if (driverId !== undefined) {
      if (driverId === null || driverId === '') {
        vehicle.driverId = undefined;
      } else {
        const driver = await User.findOne({ _id: driverId, role: 'DRIVER' });
        if (!driver) {
          return res.status(404).json({
            success: false,
            error: { code: 404, message: 'Designated driver not found.' },
          });
        }
        vehicle.driverId = driver._id;
      }
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Deactivate a fleet vehicle
// @route   DELETE /api/v1/vehicles/:id
// @access  Private (Admin, Super Admin)
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Vehicle not found.' },
      });
    }

    vehicle.isActive = false;
    vehicle.status = 'OFFLINE';
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: `Vehicle ${vehicle.plateNumber} deactivated.`,
    });
  } catch (err) {
    next(err);
  }
};
