const { ResourceListing, User, Notification, EcoCreditTransaction } = require('../models');

// @desc    Create a new P2P resource listing
// @route   POST /api/v1/exchange/listings
// @access  Private (Citizen)
exports.createListing = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      quantity,
      quantityUnit = 'KG',
      address,
      wardName,
      coordinates,
    } = req.body;

    if (!title || !category || !quantity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'Please provide title, category, and quantity.',
        },
      });
    }

    let photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    let locationData = {
      type: 'Point',
      coordinates: req.user.location?.coordinates || [74.7973, 34.0837],
    };

    if (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      locationData.coordinates = coordinates;
    }

    const listing = await ResourceListing.create({
      ownerId: req.user.id,
      title: title.trim(),
      category,
      description: description ? description.trim() : undefined,
      quantity: parseFloat(quantity),
      quantityUnit,
      address: address ? address.trim() : req.user.address,
      wardName: wardName ? wardName.trim() : req.user.wardName,
      location: locationData,
      photoUrl,
      status: 'AVAILABLE',
      version: 1,
    });

    res.status(201).json({
      success: true,
      message: 'Resource listing posted to exchange marketplace.',
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all active resource listings with filters
// @route   GET /api/v1/exchange/listings
// @access  Public
exports.getListings = async (req, res, next) => {
  try {
    const { category, wardName, status = 'AVAILABLE', search } = req.query;
    const query = {};

    if (status !== 'ALL') {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (wardName) {
      query.wardName = wardName;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const listings = await ResourceListing.find(query)
      .populate('ownerId', 'name email phone wardName')
      .populate('claimedById', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single listing by ID
// @route   GET /api/v1/exchange/listings/:id
// @access  Public
exports.getListingById = async (req, res, next) => {
  try {
    const listing = await ResourceListing.findById(req.params.id)
      .populate('ownerId', 'name email phone wardName address')
      .populate('claimedById', 'name email phone');

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: 'Resource listing not found.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Claim an available resource listing (Atomic Concurrency Guard)
// @route   POST /api/v1/exchange/listings/:id/claim
// @access  Private (Citizen)
exports.claimListing = async (req, res, next) => {
  try {
    const listing = await ResourceListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Resource listing not found.' },
      });
    }

    // Guard: Citizen cannot claim their own listing
    if (listing.ownerId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'You cannot claim your own resource listing.' },
      });
    }

    // Atomic conditional update: only succeed if status is still AVAILABLE
    const updated = await ResourceListing.findOneAndUpdate(
      { _id: req.params.id, status: 'AVAILABLE' },
      {
        status: 'RESERVED',
        claimedById: req.user.id,
        claimedAt: new Date(),
        $inc: { version: 1 },
      },
      { new: true }
    ).populate('ownerId', 'name email phone');

    if (!updated) {
      return res.status(409).json({
        success: false,
        error: {
          code: 409,
          message: 'This resource has already been claimed or is no longer available.',
        },
      });
    }

    // Notify listing owner in real-time
    await Notification.create({
      userId: updated.ownerId._id,
      type: 'REQUEST_UPDATE',
      title: 'Resource Claimed!',
      message: `${req.user.name} has reserved your listing: "${updated.title}". Please coordinate handover.`,
      data: { listingId: updated._id, claimantId: req.user.id },
    });

    res.status(200).json({
      success: true,
      message: 'Resource successfully claimed! Please contact owner to arrange pickup.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark resource exchange transaction as completed & award +25 eco-credits
// @route   POST /api/v1/exchange/listings/:id/complete
// @access  Private
exports.completeListing = async (req, res, next) => {
  try {
    const listing = await ResourceListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Resource listing not found.' },
      });
    }

    // Only owner or claimant can mark completed
    const isOwner = listing.ownerId.toString() === req.user.id;
    const isClaimant = listing.claimedById && listing.claimedById.toString() === req.user.id;

    if (!isOwner && !isClaimant && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to mark this listing as completed.' },
      });
    }

    if (listing.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'This transaction has already been completed.' },
      });
    }

    listing.status = 'COMPLETED';
    listing.completedAt = new Date();
    await listing.save();

    // Award +25 eco-credits to the listing owner for verified resource diversion
    const idempotencyKey = `RESOURCE_EXCHANGE_${listing._id}_${listing.ownerId}`;
    const existingTx = await EcoCreditTransaction.findOne({ idempotencyKey });

    let creditsEarned = 0;
    if (!existingTx) {
      creditsEarned = 25;
      const ownerUser = await User.findByIdAndUpdate(
        listing.ownerId,
        { $inc: { ecoCredits: creditsEarned } },
        { new: true }
      );
      if (ownerUser) {
        ownerUser.updateTier();
        await ownerUser.save();

        await EcoCreditTransaction.create({
          userId: listing.ownerId,
          activityType: 'RESOURCE_EXCHANGE',
          creditsEarned,
          referenceId: listing._id.toString(),
          idempotencyKey,
          balanceAfter: ownerUser.ecoCredits,
          description: `Reward for completed P2P resource exchange: ${listing.title}`,
        });

        // Notify owner
        await Notification.create({
          userId: listing.ownerId,
          type: 'CREDIT_AWARD',
          title: 'Eco-Credits Awarded! 🎉',
          message: `You earned +${creditsEarned} Eco-Credits for diverting waste via resource exchange!`,
          data: { creditsEarned, newBalance: ownerUser.ecoCredits },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resource exchange marked completed! Eco-credits awarded to contributor.',
      data: listing,
      ecoCreditsAwarded: creditsEarned,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel an available or reserved listing
// @route   PATCH /api/v1/exchange/listings/:id/cancel
// @access  Private (Owner or Admin)
exports.cancelListing = async (req, res, next) => {
  try {
    const listing = await ResourceListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Resource listing not found.' },
      });
    }

    if (listing.ownerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to cancel this listing.' },
      });
    }

    listing.status = 'CANCELLED';
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Resource listing cancelled.',
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Get own resource listings with status breakdown
// @route   GET /api/v1/exchange/my-listings
// @access  Private (Citizen)
exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await ResourceListing.find({ ownerId: req.user.id })
      .populate('claimedById', 'name email phone')
      .sort({ createdAt: -1 });

    const counts = {
      total: listings.length,
      available: listings.filter((l) => l.status === 'AVAILABLE').length,
      reserved: listings.filter((l) => l.status === 'RESERVED').length,
      completed: listings.filter((l) => l.status === 'COMPLETED').length,
      cancelled: listings.filter((l) => l.status === 'CANCELLED').length,
    };

    res.status(200).json({
      success: true,
      counts,
      data: listings,
    });
  } catch (err) {
    next(err);
  }
};
