const { 
  EcoCreditTransaction, 
  User, 
  ResourceListing, 
  SmartBin, 
  SensorReading, 
  CompostActivity, 
  DumpingReport 
} = require('../models');

// @desc    Get authenticated user's eco-credit transaction ledger
// @route   GET /api/v1/credits/ledger
// @access  Private
exports.getLedger = async (req, res, next) => {
  try {
    const transactions = await EcoCreditTransaction.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(50);

    const totalEarned = transactions.reduce(
      (sum, tx) => (tx.creditsEarned > 0 ? sum + tx.creditsEarned : sum),
      0
    );

    res.status(200).json({
      success: true,
      currentBalance: req.user.ecoCredits,
      currentTier: req.user.tier,
      totalEarned,
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Consolidated real-time personal dashboard summary
// @route   GET /api/v1/credits/citizen-summary
// @access  Private (Citizen, Admin)
exports.getCitizenSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userWard = req.user.wardName || 'Lal Chowk';

    const [
      user,
      myListings,
      myReports,
      myCompost,
      wardBins,
      recentTxs,
    ] = await Promise.all([
      User.findById(userId).select('name email phone wardName address ecoCredits tier isActive lastOtpVerifiedAt createdAt'),
      ResourceListing.find({ ownerId: userId }),
      DumpingReport.find({ citizenId: userId }),
      CompostActivity.find({ citizenId: userId }),
      SmartBin.find({ wardName: userWard, isActive: true }).select('binId name wardName currentFillPercent currentWeightKg status location'),
      EcoCreditTransaction.find({ userId }).sort({ timestamp: -1, createdAt: -1 }).limit(5),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, error: { code: 404, message: 'User not found.' } });
    }

    // Calculate personal diverted waste (kg)
    const compostKg = myCompost
      .filter((c) => c.status === 'COMPLETED' || c.status === 'IN_PROGRESS')
      .reduce((sum, c) => sum + (c.quantityKg || 0), 0);

    const exchangeKg = myListings
      .filter((l) => l.status === 'COMPLETED')
      .reduce((sum, l) => sum + (l.quantityUnit === 'KG' ? l.quantity : l.quantity * 0.5), 0);

    const personalDivertedKg = parseFloat((compostKg + exchangeKg).toFixed(1));

    // Active counts
    const activeListingsCount = myListings.filter((l) => l.status === 'AVAILABLE' || l.status === 'RESERVED').length;
    const pendingReportsCount = myReports.filter((r) => r.status === 'SUBMITTED').length;
    const activeCompostBatchesCount = myCompost.filter((c) => c.status === 'STARTED' || c.status === 'IN_PROGRESS').length;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          wardName: user.wardName,
          address: user.address,
          ecoCredits: user.ecoCredits,
          tier: user.tier,
          accountStatus: user.isActive ? 'ACTIVE' : 'DEACTIVATED',
          createdAt: user.createdAt,
        },
        personalDivertedKg,
        activeListingsCount,
        totalListingsCount: myListings.length,
        myReportsCount: myReports.length,
        pendingReportsCount,
        activeCompostBatchesCount,
        totalCompostBatchesCount: myCompost.length,
        wardSmartBins: wardBins,
        recentTransactions: recentTxs,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Srinagar community eco-credits leaderboard
// @route   GET /api/v1/credits/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const topUsers = await User.find({ isActive: true, role: 'CITIZEN' })
      .select('name wardName ecoCredits tier createdAt')
      .sort({ ecoCredits: -1 })
      .limit(10);

    const leaderboard = topUsers.map((u, index) => {
      // Obfuscate last name for privacy
      const nameParts = u.name.split(' ');
      const displayName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
          : nameParts[0];

      return {
        rank: index + 1,
        userId: u._id,
        displayName,
        wardName: u.wardName,
        ecoCredits: u.ecoCredits,
        tier: u.tier,
      };
    });

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get scientific waste diversion metrics & breakdown
// @route   GET /api/v1/analytics/diversion
// @access  Public
exports.getWasteDiversionMetrics = async (req, res, next) => {
  try {
    // 1. Measured Data: Compute total weight from Smart Bin load cells
    const smartBins = await SmartBin.find({});
    const measuredTotalKg = smartBins.reduce((acc, bin) => acc + (bin.currentWeightKg || 0), 0);

    // 2. Citizen Estimates: Compute diverted weight from completed P2P Resource Listings
    const completedListings = await ResourceListing.find({ status: 'COMPLETED' });
    
    let estimatedReusedKg = 0;
    let estimatedCompostedKg = 0;
    let estimatedRecycledKg = 0;

    for (const item of completedListings) {
      const weight = item.quantityUnit === 'KG' ? item.quantity : item.quantity * 0.5; // conversion approximation
      if (item.category === 'ORGANIC_COMPOSTABLE') {
        estimatedCompostedKg += weight;
      } else if (item.category === 'REUSABLE_CONTAINER' || item.category === 'OTHER') {
        estimatedReusedKg += weight;
      } else {
        estimatedRecycledKg += weight;
      }
    }

    // Pure database-derived weights without fabricated baselines
    const reusedKg = estimatedReusedKg;
    const compostedKg = estimatedCompostedKg;
    const recycledKg = estimatedRecycledKg;
    const residualKg = measuredTotalKg;

    const totalWasteKg = reusedKg + compostedKg + recycledKg + residualKg;
    const totalDivertedKg = reusedKg + compostedKg + recycledKg;

    // Mathematical Formula: (Reused + Composted + Recycled) / Total Waste * 100
    const diversionRate = totalWasteKg > 0 ? ((totalDivertedKg / totalWasteKg) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        diversionRatePercent: parseFloat(diversionRate),
        totalWasteKg: Math.round(totalWasteKg),
        totalDivertedKg: Math.round(totalDivertedKg),
        breakdownKg: {
          reused: Math.round(reusedKg),
          composted: Math.round(compostedKg),
          recycled: Math.round(recycledKg),
          residual: Math.round(residualKg),
        },
        dataSources: {
          measuredData: {
            source: 'ESP32 Smart Bin HX711 Load-Cell Strain Sensors',
            totalSmartBins: smartBins.length,
            measuredWeightKg: Math.round(measuredTotalKg),
            badge: 'Hardware Measured Data',
          },
          citizenEstimates: {
            source: 'Completed P2P Resource Exchanges & Recycler Drop-offs',
            totalTransactions: completedListings.length,
            estimatedWeightKg: Math.round(reusedKg + compostedKg + recycledKg),
            badge: 'Citizen-Reported Estimates',
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Get comprehensive Eco-Credit wallet details with tiers & paginated ledger
// @route   GET /api/v1/credits/wallet
// @access  Private
exports.getWalletDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const balance = user.ecoCredits || 0;

    // Determine Tier
    let tierName = 'Bronze Steward';
    let nextTierThreshold = 500;
    let tierProgressPercent = Math.min(100, Math.round((balance / 500) * 100));

    if (balance >= 3000) {
      tierName = 'Green Pioneer';
      nextTierThreshold = 3000;
      tierProgressPercent = 100;
    } else if (balance >= 1500) {
      tierName = 'Gold Champion';
      nextTierThreshold = 3000;
      tierProgressPercent = Math.min(100, Math.round(((balance - 1500) / 1500) * 100));
    } else if (balance >= 500) {
      tierName = 'Silver Guardian';
      nextTierThreshold = 1500;
      tierProgressPercent = Math.min(100, Math.round(((balance - 500) / 1000) * 100));
    }

    // Paginated transactions
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [allTransactions, paginatedTransactions, totalCount] = await Promise.all([
      EcoCreditTransaction.find({ userId: req.user.id }),
      EcoCreditTransaction.find({ userId: req.user.id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      EcoCreditTransaction.countDocuments({ userId: req.user.id }),
    ]);

    let totalEarned = 0;
    let totalRedeemed = 0;
    const breakdown = {
      composting: 0,
      dumpingReports: 0,
      resourceExchange: 0,
      redemptions: 0,
      refunds: 0,
      other: 0,
    };

    allTransactions.forEach((tx) => {
      const earned = tx.creditsEarned || tx.amount || 0;
      if (earned > 0) {
        totalEarned += earned;
        if (tx.activityType === 'COMPOSTING_ACTIVITY') breakdown.composting += earned;
        else if (tx.activityType === 'VERIFIED_DUMPING_REPORT') breakdown.dumpingReports += earned;
        else if (tx.activityType === 'RESOURCE_EXCHANGE') breakdown.resourceExchange += earned;
        else if (tx.activityType === 'REDEMPTION_REFUND') breakdown.refunds += earned;
        else breakdown.other += earned;
      } else if (earned < 0) {
        const redeemed = Math.abs(earned);
        totalRedeemed += redeemed;
        if (tx.activityType === 'MARKETPLACE_REDEMPTION') breakdown.redemptions += redeemed;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        balance,
        tier: {
          name: tierName,
          nextTierThreshold,
          progressPercent: tierProgressPercent,
        },
        metrics: {
          totalEarned,
          totalRedeemed,
          netBalance: balance,
          totalTransactions: totalCount,
        },
        breakdown,
        transactions: {
          count: paginatedTransactions.length,
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum) || 1,
          data: paginatedTransactions,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Get personal waste diversion metrics derived from own verified activities
// @route   GET /api/v1/credits/my-diversion
// @access  Private
exports.getUserWasteDiversionMetrics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [compostBatches, exchangeListings] = await Promise.all([
      CompostActivity.find({ $or: [{ citizenId: userId }, { userId }] }),
      ResourceListing.find({ creatorId: userId, status: 'COMPLETED' }),
    ]);

    let compostedKg = 0;
    compostBatches.forEach((b) => {
      compostedKg += (b.quantityKg || 0) + (b.brownQuantityKg || 0);
    });

    let reusedKg = 0;
    let recycledKg = 0;
    exchangeListings.forEach((item) => {
      const weight = item.quantityUnit === 'KG' ? (item.quantity || 0) : (item.quantity || 0) * 0.5;
      if (item.category === 'ORGANIC_COMPOSTABLE') {
        compostedKg += weight;
      } else if (item.category === 'REUSABLE_CONTAINER' || item.category === 'OTHER') {
        reusedKg += weight;
      } else {
        recycledKg += weight;
      }
    });

    const totalDivertedKg = compostedKg + reusedKg + recycledKg;
    // For household diversion without municipal landfill scale, diversion rate of active diverted streams
    const totalRecordedWasteKg = totalDivertedKg; 
    const diversionRate = totalRecordedWasteKg > 0 ? 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        diversionRatePercent: diversionRate,
        totalRecordedWasteKg: parseFloat(totalRecordedWasteKg.toFixed(1)),
        totalDivertedKg: parseFloat(totalDivertedKg.toFixed(1)),
        breakdownKg: {
          composted: parseFloat(compostedKg.toFixed(1)),
          reused: parseFloat(reusedKg.toFixed(1)),
          recycled: parseFloat(recycledKg.toFixed(1)),
        },
        hasActivity: totalDivertedKg > 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get system reward point configuration
// @route   GET /api/v1/credits/config
// @access  Public
exports.getRewardConfig = async (req, res, next) => {
  try {
    const { SystemSetting } = require('../models');
    let config = await SystemSetting.findOne({ key: 'DEFAULT_REWARD_CONFIG' });
    if (!config) {
      config = await SystemSetting.create({
        key: 'DEFAULT_REWARD_CONFIG',
        compostingPoints: 20,
        dumpingReportPoints: 50,
        recyclingDropOffPoints: 30,
        resourceExchangePoints: 25,
        sourceSegregationPoints: 15,
      });
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Update reward point configuration
// @route   PATCH /api/v1/credits/config
// @access  Private (Admin, Super Admin)
exports.updateRewardConfig = async (req, res, next) => {
  try {
    const { SystemSetting, AuditLog } = require('../models');
    const {
      compostingPoints,
      dumpingReportPoints,
      recyclingDropOffPoints,
      resourceExchangePoints,
      sourceSegregationPoints,
    } = req.body;

    let config = await SystemSetting.findOne({ key: 'DEFAULT_REWARD_CONFIG' });
    if (!config) {
      config = new SystemSetting({ key: 'DEFAULT_REWARD_CONFIG' });
    }

    if (compostingPoints !== undefined) config.compostingPoints = Math.max(0, parseInt(compostingPoints, 10));
    if (dumpingReportPoints !== undefined) config.dumpingReportPoints = Math.max(0, parseInt(dumpingReportPoints, 10));
    if (recyclingDropOffPoints !== undefined) config.recyclingDropOffPoints = Math.max(0, parseInt(recyclingDropOffPoints, 10));
    if (resourceExchangePoints !== undefined) config.resourceExchangePoints = Math.max(0, parseInt(resourceExchangePoints, 10));
    if (sourceSegregationPoints !== undefined) config.sourceSegregationPoints = Math.max(0, parseInt(sourceSegregationPoints, 10));

    config.lastUpdatedBy = req.user.id;
    await config.save();

    await AuditLog.create({
      performedBy: req.user.id,
      action: 'REWARD_CONFIG_UPDATED',
      newValue: JSON.stringify(config),
      reason: 'Admin updated system reward point values',
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: 'Reward configuration updated successfully.',
      data: config,
    });
  } catch (err) {
    next(err);
  }
};
