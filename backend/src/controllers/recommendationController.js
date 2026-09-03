const { RecyclerDirectory } = require('../models');

// Decision logic: Generate Less -> Reuse -> Compost -> Recycle -> Collect -> Dispose
const evaluateRecommendation = (category, condition, quantity) => {
  const isReusable = condition === 'CLEAN_REUSABLE' || condition === 'SLIGHTLY_USED';
  const isSoiled = condition === 'BROKEN_SOILED' || condition === 'CONTAMINATED';

  switch (category) {
    case 'Organic/Food Waste':
      return {
        category,
        primaryAction: 'COMPOST_OR_EXCHANGE',
        priorityOrder: 1, // High recovery priority
        binColor: 'GREEN',
        binName: 'Green Organic Bin',
        title: 'Home Composting or Bio-Waste Exchange',
        description: 'Ideal for household composting, vermiculture, or offering to local Srinagar kitchen gardeners.',
        options: [
          {
            type: 'HOME_COMPOST',
            label: 'Home Compost Pile / Bin',
            recommended: true,
            guidance: 'Balance with dry brown leaves or shredded cardboard in a 1:2 volume ratio.',
            link: '/compost',
          },
          {
            type: 'P2P_EXCHANGE',
            label: 'Offer on P2P Resource Exchange',
            recommended: quantity === 'COMMERCIAL_BULK' || isReusable,
            guidance: 'Nearby composters or urban farmers can collect surplus clean organic scraps.',
            link: '/exchange',
          },
        ],
        doNotDump: true,
      };

    case 'Paper/Cardboard':
      if (isReusable) {
        return {
          category,
          primaryAction: 'REUSE_OR_EXCHANGE',
          priorityOrder: 1,
          binColor: 'BLUE',
          binName: 'Blue Recyclable Bin',
          title: 'Direct Reuse & P2P Packaging Exchange',
          description: 'Intact shipping cartons and clean paper have high community utility.',
          options: [
            {
              type: 'P2P_EXCHANGE',
              label: 'List Packaging Boxes on Exchange',
              recommended: true,
              guidance: 'Residents relocating or shipping parcels can reuse sturdy boxes.',
              link: '/exchange',
            },
            {
              type: 'SCRAP_RECYCLER',
              label: 'Deliver to Scrap Dealer',
              recommended: false,
              guidance: 'Bulk cardboard is purchased at prevailing market rates per kg.',
            },
          ],
        };
      }
      return {
        category,
        primaryAction: 'RECYCLE',
        priorityOrder: 2,
        binColor: 'BLUE',
        binName: 'Blue Recyclable Bin',
        title: 'Paper Stream Recycling',
        description: isSoiled
          ? 'Heavily soiled/food-stained paper should be placed in the organic compost or residual stream.'
          : 'Flatten and place in dry recyclable collection.',
        options: [
          {
            type: 'MUNICIPAL_RECYCLING',
            label: 'Blue Bin Dry Recyclables',
            recommended: !isSoiled,
          },
        ],
      };

    case 'Plastic':
      return {
        category,
        primaryAction: 'RECYCLE',
        priorityOrder: 2,
        binColor: 'BLUE',
        binName: 'Blue Recyclable Bin',
        title: 'Plastic Segregation & Scrap Recovery',
        description: 'PET bottles, HDPE containers, and clean polythene should be separated and flattened.',
        options: [
          {
            type: 'MUNICIPAL_RECYCLING',
            label: 'Dry Recyclable Blue Bin',
            recommended: true,
            guidance: 'Ensure containers are drained and rinsed.',
          },
          {
            type: 'RECYCLER_DEPOT',
            label: 'Drop off at Plastic Recovery Hub',
            recommended: quantity === 'COMMERCIAL_BULK',
            guidance: 'Deliver directly to local industrial scrap aggregators.',
          },
        ],
      };

    case 'Glass':
      return {
        category,
        primaryAction: isReusable ? 'REUSE' : 'RECYCLE',
        priorityOrder: 2,
        binColor: 'BLUE',
        binName: 'Blue Recyclable Bin',
        title: 'Glass Jar Reuse or Melting Stream',
        description: isReusable
          ? 'Intact glass jars are reusable for household storage.'
          : 'Carefully separate broken glass to prevent sanitation worker injury.',
        options: [
          {
            type: 'P2P_EXCHANGE',
            label: 'Offer Jars for Reuse',
            recommended: isReusable,
            link: '/exchange',
          },
          {
            type: 'MUNICIPAL_RECYCLING',
            label: 'Blue Bin (Wrapped Safely)',
            recommended: !isReusable,
          },
        ],
      };

    case 'Metal':
      return {
        category,
        primaryAction: 'RECYCLE_SCRAP',
        priorityOrder: 2,
        binColor: 'BLUE',
        binName: 'Blue Recyclable Bin',
        title: 'High-Value Scrap Metal Recovery',
        description: 'Aluminium beverage cans, tin food cans, and scrap iron have 100% recyclability.',
        options: [
          {
            type: 'SCRAP_DEALER',
            label: 'Sell to Local Scrap Aggregator',
            recommended: true,
            guidance: 'Monetize scrap metal through registered Srinagar recyclers.',
          },
        ],
      };

    case 'E-Waste':
      return {
        category,
        primaryAction: 'HAZARDOUS_SPECIAL_DEPOT',
        priorityOrder: 3,
        binColor: 'YELLOW',
        binName: 'Dedicated E-Waste Container',
        title: 'Authorized E-Waste Channel',
        description: 'Contains heavy metals and hazardous circuitry. Never mix with regular trash.',
        options: [
          {
            type: 'AUTHORIZED_EWASTE_CENTER',
            label: 'Deposit at SIDCO Rangreth E-Waste Depot',
            recommended: true,
            guidance: 'Certified safe dismantling and component recovery.',
          },
        ],
        safetyWarning: 'Do not burn, crush, or disassemble lithium-ion batteries or circuit boards.',
      };

    case 'Textile':
      return {
        category,
        primaryAction: isReusable ? 'DONATE_OR_EXCHANGE' : 'RECYCLE',
        priorityOrder: 1,
        binColor: 'BLUE',
        binName: 'Dry Recyclables Bin',
        title: 'Textile Donation & Secondary Use',
        description: isReusable
          ? 'Clean wearable clothing can be donated or listed in Resource Exchange.'
          : 'Torn or damaged textiles can be repurposed into industrial cleaning wipes.',
        options: [
          {
            type: 'P2P_EXCHANGE',
            label: 'List Clothes on Resource Exchange',
            recommended: isReusable,
            link: '/exchange',
          },
        ],
      };

    case 'Hazardous/Special Waste':
      return {
        category,
        primaryAction: 'HAZARDOUS_ISOLATION',
        priorityOrder: 4,
        binColor: 'RED',
        binName: 'Hazardous Waste Red Bin',
        title: 'Isolated Chemical & Medical Waste',
        description: 'Requires specialized incineration or secure sanitary landfilling.',
        safetyWarning: 'Corrosive or biohazardous. Keep sealed and away from water sources.',
        options: [
          {
            type: 'MUNICIPAL_SPECIAL_PICKUP',
            label: 'Request Hazardous Waste Collection',
            recommended: true,
            link: '/collection',
          },
        ],
      };

    default: // Residual Waste
      return {
        category: 'Residual Waste',
        primaryAction: 'MUNICIPAL_DISPOSAL',
        priorityOrder: 5,
        binColor: 'BLACK',
        binName: 'Residual Black/Grey Bin',
        title: 'Controlled Sanitary Disposal',
        description: 'Non-recyclable sanitary waste or contaminated materials without resource recovery viability.',
        options: [
          {
            type: 'MUNICIPAL_SCHEDULED_BIN',
            label: 'Deposit in Black Bin for Sanitary Landfilling',
            recommended: true,
          },
        ],
      };
  }
};

// @desc    Evaluate contextual waste-to-action recommendation
// @route   POST /api/v1/recommendations/evaluate
// @access  Public
exports.getRecommendation = async (req, res, next) => {
  try {
    const { category, condition = 'CLEAN_REUSABLE', quantity = 'HOUSEHOLD_SMALL', wardName } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'Please provide a waste category to evaluate.',
        },
      });
    }

    const recommendation = evaluateRecommendation(category, condition, quantity);

    // Fetch matching local recyclers for this category
    let localRecyclers = [];
    try {
      const query = { isVerified: true };
      if (wardName) {
        query.wardName = wardName;
      }
      localRecyclers = await RecyclerDirectory.find(query).limit(4);

      // Fallback: If no recyclers in exact ward, return general city recyclers
      if (localRecyclers.length === 0) {
        localRecyclers = await RecyclerDirectory.find({ isVerified: true }).limit(4);
      }
    } catch {
      localRecyclers = [];
    }

    res.status(200).json({
      success: true,
      data: {
        ...recommendation,
        condition,
        quantity,
        localRecyclers,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get directory of verified Srinagar recyclers
// @route   GET /api/v1/recommendations/recyclers
// @access  Public
exports.getRecyclers = async (req, res, next) => {
  try {
    const { material, wardName } = req.query;
    const query = { isVerified: true };

    if (material) {
      query.acceptedMaterials = { $regex: material, $options: 'i' };
    }
    if (wardName) {
      query.wardName = wardName;
    }

    const recyclers = await RecyclerDirectory.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: recyclers.length,
      data: recyclers,
    });
  } catch (err) {
    next(err);
  }
};
