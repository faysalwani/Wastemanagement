const { RecyclerDirectory, AuditLog } = require('../models');

// @desc    Get verified recyclers and recovery centers with filters & pagination
// @route   GET /api/v1/recyclers
// @access  Public
exports.getRecyclers = async (req, res, next) => {
  try {
    const { material, wardName, search, page = 1, limit = 20 } = req.query;
    const query = { isVerified: true };

    if (material && material !== 'ALL') {
      query.acceptedMaterials = { $in: [new RegExp(material.trim(), 'i')] };
    }

    if (wardName && wardName !== 'ALL') {
      query.wardName = new RegExp(wardName.trim(), 'i');
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } },
        { acceptedMaterials: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [recyclers, total] = await Promise.all([
      RecyclerDirectory.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      RecyclerDirectory.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: recyclers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: recyclers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single recycler details
// @route   GET /api/v1/recyclers/:id
// @access  Public
exports.getRecyclerById = async (req, res, next) => {
  try {
    const recycler = await RecyclerDirectory.findById(req.params.id);
    if (!recycler) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Recycling facility not found.' },
      });
    }

    res.status(200).json({
      success: true,
      data: recycler,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Add new recycler facility
// @route   POST /api/v1/recyclers
// @access  Private (Admin, Super Admin)
exports.createRecycler = async (req, res, next) => {
  try {
    const {
      name,
      contactPhone,
      contactEmail,
      acceptedMaterials = [],
      address,
      wardName,
      coordinates,
      operatingHours,
      ratesPerKg,
      isVerified = true,
    } = req.body;

    if (!name || !contactPhone || !address || !wardName) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide facility name, phone, address, and ward name.' },
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
    }

    const recycler = await RecyclerDirectory.create({
      name: name.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail ? contactEmail.trim() : undefined,
      acceptedMaterials: Array.isArray(acceptedMaterials)
        ? acceptedMaterials
        : acceptedMaterials.split(',').map((m) => m.trim()).filter(Boolean),
      address: address.trim(),
      wardName: wardName.trim(),
      location: {
        type: 'Point',
        coordinates: locationCoords,
      },
      operatingHours: operatingHours || 'Mon - Sat: 9:00 AM - 6:00 PM',
      ratesPerKg: ratesPerKg || {},
      isVerified,
    });

    await AuditLog.create({
      performedBy: req.user.id,
      action: 'RECYCLER_CREATED',
      newValue: recycler.name,
      reason: `Admin registered recycler: ${recycler.name} in ${recycler.wardName}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Recycling facility registered successfully.',
      data: recycler,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Update recycler facility
// @route   PATCH /api/v1/recyclers/:id
// @access  Private (Admin, Super Admin)
exports.updateRecycler = async (req, res, next) => {
  try {
    const recycler = await RecyclerDirectory.findById(req.params.id);
    if (!recycler) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Recycling facility not found.' },
      });
    }

    const {
      name,
      contactPhone,
      contactEmail,
      acceptedMaterials,
      address,
      wardName,
      coordinates,
      operatingHours,
      ratesPerKg,
      isVerified,
    } = req.body;

    if (name) recycler.name = name.trim();
    if (contactPhone) recycler.contactPhone = contactPhone.trim();
    if (contactEmail !== undefined) recycler.contactEmail = contactEmail.trim();
    if (acceptedMaterials) {
      recycler.acceptedMaterials = Array.isArray(acceptedMaterials)
        ? acceptedMaterials
        : acceptedMaterials.split(',').map((m) => m.trim()).filter(Boolean);
    }
    if (address) recycler.address = address.trim();
    if (wardName) recycler.wardName = wardName.trim();
    if (coordinates && Array.isArray(coordinates)) {
      recycler.location.coordinates = coordinates;
    }
    if (operatingHours) recycler.operatingHours = operatingHours;
    if (ratesPerKg) recycler.ratesPerKg = ratesPerKg;
    if (isVerified !== undefined) recycler.isVerified = isVerified;

    await recycler.save();

    res.status(200).json({
      success: true,
      message: 'Recycling facility updated successfully.',
      data: recycler,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Delete recycler facility
// @route   DELETE /api/v1/recyclers/:id
// @access  Private (Admin, Super Admin)
exports.deleteRecycler = async (req, res, next) => {
  try {
    const recycler = await RecyclerDirectory.findByIdAndDelete(req.params.id);
    if (!recycler) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Recycling facility not found.' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recycling facility deleted from directory.',
    });
  } catch (err) {
    next(err);
  }
};
