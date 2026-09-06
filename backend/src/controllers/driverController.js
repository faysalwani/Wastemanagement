const { User, Vehicle, CollectionRun } = require('../models');

// @desc    Admin: Get driver directory with assigned vehicle, current run, and statistics
// @route   GET /api/v1/drivers
// @access  Private (Admin, Super Admin)
exports.getDriverDirectory = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: 'DRIVER' })
      .select('name email phone wardName isActive createdAt lastLogin')
      .sort({ name: 1 });

    const enriched = await Promise.all(
      drivers.map(async (driver) => {
        const [assignedVehicle, activeRun, completedRunsCount] = await Promise.all([
          Vehicle.findOne({ driverId: driver._id, isActive: true }).select('plateNumber model vehicleId status capacityKg'),
          CollectionRun.findOne({ driverId: driver._id, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } }).select('runId status totalStops completedStops'),
          CollectionRun.countDocuments({ driverId: driver._id, status: 'COMPLETED' }),
        ]);

        return {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          wardName: driver.wardName,
          isActive: driver.isActive,
          assignedVehicle: assignedVehicle || null,
          activeRun: activeRun || null,
          completedRunsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};
