const { DumpingReport, User, EcoCreditTransaction, Notification } = require('../models');
const { getIO } = require('../sockets/socketHandler');

// @desc    Submit an illicit open-dumping complaint
// @route   POST /api/v1/reports
// @access  Private (Citizen)
exports.submitReport = async (req, res, next) => {
  try {
    const {
      wasteCategory = 'MIXED_MUNICIPAL',
      severity = 'MEDIUM',
      description,
      address,
      wardName = 'Lal Chowk',
      coordinates,
    } = req.body;

    let photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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

    const report = await DumpingReport.create({
      citizenId: req.user.id,
      photoUrl: photoUrl || '/uploads/default_dump.jpg',
      location: {
        type: 'Point',
        coordinates: locationCoords,
      },
      wardName,
      address: address ? address.trim() : 'Srinagar, J&K',
      wasteCategory,
      severity,
      description: description ? description.trim() : 'Open waste dumping report',
      status: 'SUBMITTED',
    });

    // Notify municipal admins in real-time
    try {
      const io = getIO();
      io.to('admin_room').emit('new_dumping_report', {
        reportId: report._id,
        wardName: report.wardName,
        severity: report.severity,
        wasteCategory: report.wasteCategory,
        location: report.location,
        submittedAt: report.createdAt,
      });
    } catch {
      // Ignore if socket not ready
    }

    res.status(201).json({
      success: true,
      message: 'Open-dumping complaint registered with municipal authorities.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all dumping reports with status, ward, and severity filters
// @route   GET /api/v1/reports
// @access  Public
exports.getReports = async (req, res, next) => {
  try {
    const { wardName, status, severity } = req.query;
    const query = {};

    if (wardName) query.wardName = wardName;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const reports = await DumpingReport.find(query)
      .populate('reportedById', 'name email wardName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Spatial clustering of open-dumping complaints into recurring 250m Hotspots
// @route   GET /api/v1/reports/hotspots
// @access  Public
exports.getHotspots = async (req, res, next) => {
  try {
    const reports = await DumpingReport.find({ status: { $ne: 'RESOLVED' } });

    // Simple, deterministic DBSCAN-like spatial clustering for radius = 250m (~0.0025 degrees)
    const CLUSTER_RADIUS_DEG = 0.003;
    const hotspots = [];
    const visited = new Set();

    for (let i = 0; i < reports.length; i++) {
      if (visited.has(reports[i]._id.toString())) continue;

      const base = reports[i];
      const clusterMembers = [base];
      visited.add(base._id.toString());

      for (let j = i + 1; j < reports.length; j++) {
        if (visited.has(reports[j]._id.toString())) continue;
        const target = reports[j];

        const dx = base.location.coordinates[0] - target.location.coordinates[0];
        const dy = base.location.coordinates[1] - target.location.coordinates[1];
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= CLUSTER_RADIUS_DEG) {
          clusterMembers.push(target);
          visited.add(target._id.toString());
        }
      }

      // Hotspot definition: 2 or more reports within spatial cluster radius
      if (clusterMembers.length >= 2) {
        // Compute cluster centroid
        const avgLng =
          clusterMembers.reduce((sum, r) => sum + r.location.coordinates[0], 0) /
          clusterMembers.length;
        const avgLat =
          clusterMembers.reduce((sum, r) => sum + r.location.coordinates[1], 0) /
          clusterMembers.length;

        hotspots.push({
          hotspotId: `HOTSPOT_${hotspots.length + 1}`,
          wardName: base.wardName,
          incidentCount: clusterMembers.length,
          centroid: [avgLng, avgLat],
          radiusMeters: 250,
          highestSeverity: clusterMembers.some((r) => r.severity === 'CRITICAL')
            ? 'CRITICAL'
            : clusterMembers.some((r) => r.severity === 'HIGH')
            ? 'HIGH'
            : 'MEDIUM',
          reports: clusterMembers.map((r) => ({
            id: r._id,
            category: r.wasteCategory,
            date: r.createdAt,
          })),
        });
      }
    }

    res.status(200).json({
      success: true,
      count: hotspots.length,
      clusterThresholdMeters: 250,
      data: hotspots,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Verify, assign, or resolve complaint & award +50 eco-credits
// @route   PATCH /api/v1/reports/:id/verify
// @access  Private (Admin)
exports.verifyReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await DumpingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Dumping report not found.' },
      });
    }

    const previousStatus = report.status;
    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (status === 'RESOLVED') report.resolvedAt = new Date();

    await report.save();

    // Award +50 Eco-Credits when report transitions to VERIFIED or RESOLVED
    let creditsAwarded = 0;
    if (
      (status === 'VERIFIED' || status === 'RESOLVED') &&
      previousStatus !== 'VERIFIED' &&
      previousStatus !== 'RESOLVED'
    ) {
      const targetCitizenId = report.citizenId || report.reportedById;
      const idempotencyKey = `VERIFIED_REPORT_${report._id}_${targetCitizenId}`;
      const existingTx = await EcoCreditTransaction.findOne({ idempotencyKey });

      if (!existingTx && targetCitizenId) {
        creditsAwarded = 50;
        const citizen = await User.findByIdAndUpdate(
          targetCitizenId,
          { $inc: { ecoCredits: creditsAwarded } },
          { new: true }
        );
        if (citizen) {
          citizen.updateTier();
          await citizen.save();

          await EcoCreditTransaction.create({
            userId: targetCitizenId,
            activityType: 'VERIFIED_DUMPING_REPORT',
            creditsEarned: creditsAwarded,
            referenceId: report._id.toString(),
            idempotencyKey,
            balanceAfter: citizen.ecoCredits,
            description: `Citizen reward for verified illicit dumping report in ${report.wardName}`,
          });

          await Notification.create({
            userId: targetCitizenId,
            type: 'REPORT_VERIFIED',
            title: 'Dumping Complaint Verified! 🌟',
            message: `Municipal authorities verified your dumping report. +${creditsAwarded} Eco-Credits added to your account!`,
            data: { reportId: report._id, creditsAwarded },
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Report status updated to ${report.status}.`,
      data: report,
      creditsAwarded,
    });
  } catch (err) {
    next(err);
  }
};
