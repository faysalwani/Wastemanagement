const { Vehicle, VehicleLocation, User, Notification } = require('../models');
const { getIO } = require('../sockets/socketHandler');

// Proximity Hysteresis & Cooldown State Tracker (in-memory)
// citizenId -> { state: 'ALERTED' | 'IDLE', lastAlertedAt: timestamp }
const proximityState = new Map();

function calculateDistanceMeters(c1, c2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((c2[1] - c1[1]) * Math.PI) / 180;
  const dLng = ((c2[0] - c1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[1] * Math.PI) / 180) *
      Math.cos((c2[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// @desc    Driver streams live GPS telemetry & triggers 500m proximity alerts
// @route   POST /api/v1/tracking/update
// @access  Private (Driver)
exports.updateVehicleLocation = async (req, res, next) => {
  try {
    const { vehicleId, coordinates, speedKmph = 0, heading = 0 } = req.body;

    if (!vehicleId || !coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide vehicleId and coordinates array [lng, lat].' },
      });
    }

    const vehicle = await Vehicle.findOne({
      $or: [
        { vehicleId: vehicleId.toUpperCase() },
        { vehicleNumber: vehicleId.toUpperCase() },
      ],
    });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Vehicle not found.' },
      });
    }

    // Update vehicle live position
    vehicle.currentLocation = {
      type: 'Point',
      coordinates,
    };
    vehicle.status = 'ON_ROUTE';
    vehicle.lastPing = new Date();
    await vehicle.save();

    // Log breadcrumb
    await VehicleLocation.create({
      vehicleId: vehicle._id,
      location: vehicle.currentLocation,
      speedKmph,
      heading,
      recordedAt: new Date(),
    });

    // Broadcast live location over Socket.io
    const io = getIO();
    io.emit('vehicle_location_updated', {
      vehicleId: vehicle.vehicleId,
      plateNumber: vehicle.plateNumber,
      driverName: req.user.name,
      coordinates,
      speedKmph,
      heading,
      timestamp: vehicle.lastPing,
    });

    // --- 500m PROXIMITY HYSTERESIS ENGINE ---
    // Find active citizens in same ward or nearby
    const citizens = await User.find({
      role: 'CITIZEN',
      isActive: true,
      'location.coordinates': { $exists: true },
    }).select('name wardName location');

    const now = Date.now();
    const COOLDOWN_MS = 45 * 60 * 1000; // 45-minute cooldown
    const TRIGGER_DIST_M = 500;         // 500m alert trigger
    const RESET_DIST_M = 650;           // 650m hysteresis reset

    let alertsTriggered = 0;

    for (const citizen of citizens) {
      if (!citizen.location?.coordinates || citizen.location.coordinates.length < 2) continue;

      const distM = calculateDistanceMeters(coordinates, citizen.location.coordinates);
      const citizenId = citizen._id.toString();
      const state = proximityState.get(citizenId) || { state: 'IDLE', lastAlertedAt: 0 };

      // Reset condition: Vehicle has moved safely beyond 650m
      if (distM > RESET_DIST_M) {
        state.state = 'IDLE';
        proximityState.set(citizenId, state);
      }
      // Trigger condition: Vehicle is within 500m AND not already in ALERTED state AND cooldown elapsed
      else if (
        distM <= TRIGGER_DIST_M &&
        state.state === 'IDLE' &&
        now - state.lastAlertedAt > COOLDOWN_MS
      ) {
        state.state = 'ALERTED';
        state.lastAlertedAt = now;
        proximityState.set(citizenId, state);
        alertsTriggered++;

        // Send real-time banner/sound alert to citizen via Socket.io user room
        io.to(`user_${citizenId}`).emit('proximity_alert', {
          vehicleId: vehicle.vehicleId,
          plateNumber: vehicle.plateNumber,
          driverName: req.user.name,
          distanceMeters: Math.round(distM),
          message: `Collection vehicle is approaching (${Math.round(distM)}m away)! Please bring out your segregated waste bins.`,
        });

        // Log in-app notification
        await Notification.create({
          userId: citizen._id,
          type: 'PROXIMITY_ALERT',
          title: 'Collection Truck Approaching! 🚛',
          message: `Municipal collection vehicle (${vehicle.plateNumber}) is within ${Math.round(distM)}m of your location.`,
          data: { vehicleId: vehicle.vehicleId, distanceMeters: Math.round(distM) },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Location breadcrumb processed.',
      data: {
        vehicleId: vehicle.vehicleId,
        coordinates,
        speedKmph,
        proximityAlertsTriggered: alertsTriggered,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active fleet locations for live radar
// @route   GET /api/v1/tracking/fleet
// @access  Public
exports.getFleetLocations = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('driverId', 'name phone')
      .select('vehicleId plateNumber type capacityKg status currentLocation lastPing');

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (err) {
    next(err);
  }
};
