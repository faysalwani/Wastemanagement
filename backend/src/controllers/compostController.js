const { CompostActivity, User, EcoCreditTransaction, Notification } = require('../models');

// Helper: Scientific Composting Recommendation Engine
const generateRecommendation = (wasteType, quantityKg = 1, method = 'HOME_BIN') => {
  const isLeaves = wasteType === 'LEAVES_CHINAR';
  const isCoffee = wasteType === 'COFFEE_TEA_WASTE';
  const isGarden = wasteType === 'GARDEN_PLANT_WASTE';

  let methodAdvice = 'Home Compost Bin (Aerated plastic or wooden bin with drainage holes)';
  let timelineWeeks = 8;

  if (method === 'VERMICOMPOSTING') {
    methodAdvice = 'Vermicomposting with Eisenia fetida (Red Wiggler earthworms in a shallow, dark bin)';
    timelineWeeks = 6;
  } else if (method === 'OUTDOOR_PILE') {
    methodAdvice = 'Outdoor Garden Heap (Minimum 1m x 1m x 1m pile for core thermophilic heat retention)';
    timelineWeeks = 10;
  } else if (method === 'COMMUNITY_TUMBLER') {
    methodAdvice = 'Rotary Drum / Tumbler (Easy dual-chamber aeration system)';
    timelineWeeks = 5;
  }

  return {
    isSuitable: true,
    method: methodAdvice,
    preparation: isLeaves
      ? 'Shred or crush dry Chinar leaves into smaller fragments to accelerate bacterial colonization.'
      : 'Chop kitchen scraps into 1-2 inch pieces. Drain excess fluid before layering.',
    mixRatio: isLeaves
      ? 'Chinar leaves are high in Carbon (Browns). Mix with fresh kitchen green waste in a 2:1 ratio by volume.'
      : 'Maintain a 2:1 volume ratio of Browns (Dry Chinar leaves, cardboard shreds, dry straw) to Greens (your scraps).',
    moistureGuidance:
      'Maintain 40–60% moisture. The compost mass should feel like a wrung-out damp sponge—moist to the touch without water pooling at the bottom.',
    turningGuidance:
      method === 'COMMUNITY_TUMBLER'
        ? 'Rotate the tumbler drum 3-4 times every 2-3 days.'
        : 'Turn or fork the batch once weekly in summer, biweekly during cold periods to introduce oxygen and prevent anaerobic odors.',
    processTimeline: `Approx. ${timelineWeeks}–${timelineWeeks + 4} weeks depending on Srinagar ambient temperature. During sub-zero Kashmir winter months (Dec–Feb), decomposition decelerates naturally; keep bin in a sunny courtyard or insulate with straw.`,
    thingsToAvoid: [
      'Cooked oils, fat, and grease (smothers beneficial aerobic bacteria)',
      'Meat, bones, and dairy (attracts rodents and creates foul odor)',
      'Cat or dog feces (may introduce harmful pathogens)',
      'Diseased garden foliage or chemically treated wood shavings',
    ],
    readinessIndicators:
      'Compost is mature when it transforms into dark, crumbly humus with a pleasant forest-floor aroma, and the internal core temperature cools to ambient.',
    troubleshooting:
      'Ammonia smell: Add dry leaves/shredded cardboard. Rotten egg / sulfur odor: Turn immediately to aerate. Pile too dry / cold: Sprinkle with tepid water and add vegetable peels.',
  };
};

// @desc    Generate practical composting recommendation based on waste details
// @route   POST /api/v1/compost/recommend
// @access  Public
exports.getRecommendation = async (req, res, next) => {
  try {
    const { wasteType = 'VEGETABLE_SCRAPS', quantityKg = 1, method = 'HOME_BIN' } = req.body;
    const qty = parseFloat(quantityKg);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide a valid quantity greater than zero.' },
      });
    }

    if (qty > 200) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Household composting batch quantity cannot exceed 200 kg.' },
      });
    }

    const recommendation = generateRecommendation(wasteType, qty, method);

    res.status(200).json({
      success: true,
      data: {
        wasteType,
        quantityKg: qty,
        method,
        recommendation,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Create and save a composting activity batch (+20 Eco-Credits)
// @route   POST /api/v1/compost/activities
// @access  Private (Citizen, Admin)
exports.createActivity = async (req, res, next) => {
  try {
    const {
      wasteType,
      quantityKg,
      brownMaterialType = 'Dry Chinar Leaves & Shredded Cardboard',
      brownQuantityKg = 0,
      method = 'HOME_BIN',
      notes,
    } = req.body;

    const qty = parseFloat(quantityKg);
    if (!wasteType) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please select an organic waste category.' },
      });
    }

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Quantity must be a positive number greater than 0 kg.' },
      });
    }

    if (qty > 200) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Batch quantity cannot exceed 200 kg for household composting.' },
      });
    }

    const recommendation = generateRecommendation(wasteType, qty, method);
    const estimatedWeeks = method === 'COMMUNITY_TUMBLER' ? 6 : method === 'VERMICOMPOSTING' ? 6 : 8;
    const estimatedMaturityDate = new Date(Date.now() + estimatedWeeks * 7 * 24 * 60 * 60 * 1000);

    const activity = await CompostActivity.create({
      citizenId: req.user.id,
      wasteType,
      quantityKg: qty,
      brownMaterialType: brownMaterialType ? brownMaterialType.trim() : 'Dry Chinar Leaves',
      brownQuantityKg: parseFloat(brownQuantityKg) || 0,
      method,
      status: 'STARTED',
      estimatedMaturityWeeks: estimatedWeeks,
      estimatedMaturityDate,
      notes: notes ? notes.trim() : undefined,
      recommendation,
    });

    // Award +20 Eco-Credits idempotently
    const idempotencyKey = `COMPOSTING_ACTIVITY_${activity._id}_${req.user.id}`;
    const user = await User.findById(req.user.id);

    if (user) {
      const existingTx = await EcoCreditTransaction.findOne({ idempotencyKey });
      if (!existingTx) {
        user.ecoCredits += 20;
        user.updateTier();
        await user.save();

        await EcoCreditTransaction.create({
          userId: user._id,
          activityType: 'COMPOSTING_ACTIVITY',
          creditsEarned: 20,
          referenceId: activity._id.toString(),
          idempotencyKey,
          balanceAfter: user.ecoCredits,
          description: `Logged household composting batch (${qty} kg of ${wasteType.replace(/_/g, ' ')})`,
        });

        activity.ecoCreditsAwarded = true;
        await activity.save();

        try {
          await Notification.create({
            userId: user._id,
            type: 'ECO_CREDIT_REWARD',
            title: 'Eco-Credits Awarded! 🌱',
            message: `You earned +20 Eco-Credits for starting a household composting batch. Current balance: ${user.ecoCredits} pts.`,
            data: { activityId: activity._id },
          });
        } catch {}
      }
    }

    res.status(201).json({
      success: true,
      message: 'Composting activity logged successfully! +20 Eco-Credits awarded.',
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: View own logged composting activities
// @route   GET /api/v1/compost/activities
// @access  Private (Citizen, Admin)
exports.getMyActivities = async (req, res, next) => {
  try {
    const activities = await CompostActivity.find({ citizenId: req.user.id })
      .sort({ createdAt: -1 });

    const totalCompostedKg = activities
      .filter((a) => a.status !== 'CANCELLED')
      .reduce((sum, a) => sum + (a.quantityKg || 0), 0);

    res.status(200).json({
      success: true,
      count: activities.length,
      totalCompostedKg: parseFloat(totalCompostedKg.toFixed(1)),
      data: activities,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Update status of a composting batch
// @route   PATCH /api/v1/compost/activities/:id/status
// @access  Private (Citizen, Admin)
exports.updateActivityStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      });
    }

    const activity = await CompostActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Composting activity not found.' },
      });
    }

    // Server-side ownership guard
    if (activity.citizenId.toString() !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized. You cannot modify another citizen’s composting activity.' },
      });
    }

    activity.status = status;
    if (notes) activity.notes = notes.trim();
    await activity.save();

    res.status(200).json({
      success: true,
      message: `Composting activity status updated to ${status}.`,
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Delete/Cancel draft composting activity
// @route   DELETE /api/v1/compost/activities/:id
// @access  Private (Citizen, Admin)
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await CompostActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Composting activity not found.' },
      });
    }

    if (activity.citizenId.toString() !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized.' },
      });
    }

    await CompostActivity.deleteOne({ _id: activity._id });

    res.status(200).json({
      success: true,
      message: 'Composting batch record removed.',
    });
  } catch (err) {
    next(err);
  }
};
