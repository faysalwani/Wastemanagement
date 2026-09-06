const { SmartBinAlert, SmartBin, User } = require('../models');

// @desc    Get all smart bin alerts with auto-synchronization from live bin state
// @route   GET /api/v1/iot/alerts
// @access  Private (Admin, Super Admin)
exports.getAlerts = async (req, res, next) => {
  try {
    const { status, severity, wardName } = req.query;

    // 1. Auto-synchronize alerts: inspect active bins for high fill or offline state
    const bins = await SmartBin.find({ isActive: true });
    const now = Date.now();

    for (const bin of bins) {
      // Check Fill >= 80%
      if (bin.currentFillPercent >= 80) {
        const existingAlert = await SmartBinAlert.findOne({
          binId: bin._id,
          alertType: 'FILL_THRESHOLD_EXCEEDED',
          status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] },
        });

        if (!existingAlert) {
          await SmartBinAlert.create({
            binId: bin._id,
            binIdentifier: bin.binId,
            wardName: bin.wardName,
            alertType: 'FILL_THRESHOLD_EXCEEDED',
            severity: bin.currentFillPercent >= 90 ? 'CRITICAL' : 'HIGH',
            message: `Smart Bin ${bin.binId} in ${bin.wardName} is critically full (${bin.currentFillPercent}%). Immediate collection dispatch required.`,
            currentFillPercent: bin.currentFillPercent,
            status: 'ACTIVE',
            triggeredAt: new Date(),
          });
        }
      }

      // Check Offline (> 30 mins since last seen)
      const minutesSinceLastSeen = bin.lastSeen ? (now - new Date(bin.lastSeen).getTime()) / (1000 * 60) : 999;
      if (minutesSinceLastSeen > 30) {
        const existingOfflineAlert = await SmartBinAlert.findOne({
          binId: bin._id,
          alertType: 'DEVICE_OFFLINE',
          status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] },
        });

        if (!existingOfflineAlert) {
          await SmartBinAlert.create({
            binId: bin._id,
            binIdentifier: bin.binId,
            wardName: bin.wardName,
            alertType: 'DEVICE_OFFLINE',
            severity: 'MEDIUM',
            message: `ESP32 telemetry offline for Smart Bin ${bin.binId} (${Math.round(minutesSinceLastSeen)} minutes silent).`,
            currentFillPercent: bin.currentFillPercent,
            status: 'ACTIVE',
            triggeredAt: new Date(),
          });
        }
      }
    }

    // 2. Query alerts
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (wardName) query.wardName = wardName;

    const alerts = await SmartBinAlert.find(query)
      .populate('acknowledgedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ triggeredAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Acknowledge an alert
// @route   PATCH /api/v1/iot/alerts/:id/acknowledge
// @access  Private (Admin, Super Admin)
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await SmartBinAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Alert not found.' },
      });
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.user.id;
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Resolve an alert
// @route   PATCH /api/v1/iot/alerts/:id/resolve
// @access  Private (Admin, Super Admin)
exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await SmartBinAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Alert not found.' },
      });
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user.id;
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert marked as resolved.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};
