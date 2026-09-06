const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const {
  User,
  SmartBin,
  SensorReading,
  Vehicle,
  RecyclerDirectory,
  DumpingReport,
  ResourceListing,
  EcoCreditTransaction,
  CollectionRun,
  CollectionRequest,
  CollectionSchedule,
  SmartBinAlert,
  CompostActivity,
  Product,
  Order,
  SystemSetting,
  Notification,
} = require('../models');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Connected to database. Purging existing seed data...');

    // Clear existing collections
    await User.deleteMany({});
    await SmartBin.deleteMany({});
    await SensorReading.deleteMany({});
    await Vehicle.deleteMany({});
    await RecyclerDirectory.deleteMany({});
    await DumpingReport.deleteMany({});
    await ResourceListing.deleteMany({});
    await EcoCreditTransaction.deleteMany({});
    await CollectionRun.deleteMany({});
    await CollectionRequest.deleteMany({});
    await CollectionSchedule.deleteMany({});
    await SmartBinAlert.deleteMany({});
    await CompostActivity.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await SystemSetting.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seeder] Creating standard system users...');

    // 1. Create Core Users
    const superAdminUser = await User.create({
      name: process.env.SUPER_ADMIN_NAME || 'Mohd Faisal wani',
      email: process.env.SUPER_ADMIN_EMAIL || 'faysalwani9086@gmail.com',
      role: 'SUPER_ADMIN', // No password for Super Admin (OTP Only)
      phone: process.env.SUPER_ADMIN_PHONE || '+91 6005537335',
      wardName: process.env.SUPER_ADMIN_WARD || 'Lal Chowk',
      address: 'SMC Directorate, Srinagar',
      location: { type: 'Point', coordinates: [74.8080, 34.0725] },
      ecoCredits: 1000,
      tier: 'ECO_CHAMPION',
      lastOtpVerifiedAt: new Date(),
    });

    const adminUser = await User.create({
      name: 'Dr. Municipal Administrator',
      email: 'admin@ecocycle.local',
      role: 'ADMIN', // No password for Admin (OTP Only)
      phone: '+91 9419000001',
      wardName: 'Lal Chowk',
      address: 'SMC Central Complex, Srinagar',
      location: { type: 'Point', coordinates: [74.8080, 34.0725] },
      ecoCredits: 500,
      tier: 'ECO_CHAMPION',
      lastOtpVerifiedAt: new Date(),
    });

    const driverUser = await User.create({
      name: 'Tariq Ahmad (Driver)',
      email: 'driver@ecocycle.local',
      role: 'DRIVER', // No password for Driver (OTP Only)
      phone: '+91 9419000002',
      wardName: 'Batamaloo',
      address: 'Batamaloo Fleet Depot, Srinagar',
      location: { type: 'Point', coordinates: [74.7950, 34.0710] },
      ecoCredits: 150,
      tier: 'SILVER',
      lastOtpVerifiedAt: new Date(),
    });

    const citizenUser = await User.create({
      name: 'Mohd Faisal Wani (Citizen)',
      email: 'citizen@ecocycle.local',
      password: 'Citizen@123',
      role: 'CITIZEN',
      phone: '+91 9419000003',
      wardName: 'Rajbagh',
      address: 'Rajbagh Sector 2, Srinagar',
      location: { type: 'Point', coordinates: [74.8210, 34.0670] },
      ecoCredits: 120,
      tier: 'SILVER',
      lastOtpVerifiedAt: new Date(),
    });

    console.log('[Seeder] Users created successfully.');

    // 2. Create Collection Vehicles
    const vehicle1 = await Vehicle.create({
      vehicleNumber: 'JK-01-WM-2026',
      plateNumber: 'JK-01-WM-2026',
      vehicleId: 'VEH-SRG-01',
      model: 'Tata Ace Mini Compactor (Electric)',
      capacityKg: 1200,
      vehicleType: 'MINI_COMPACTOR',
      driverId: driverUser._id,
      status: 'AVAILABLE',
      isActive: true,
      currentLocation: { type: 'Point', coordinates: [74.8080, 34.0725] },
      speedKmh: 0,
      heading: 45,
      lastLocationUpdate: new Date(),
    });

    const vehicle2 = await Vehicle.create({
      vehicleNumber: 'JK-01-WM-2027',
      plateNumber: 'JK-01-WM-2027',
      vehicleId: 'VEH-SRG-02',
      model: 'Mahindra Bolero Tipper Compactor',
      capacityKg: 1500,
      vehicleType: 'TIPPER_TRUCK',
      status: 'AVAILABLE',
      isActive: true,
      currentLocation: { type: 'Point', coordinates: [74.7950, 34.0710] },
      speedKmh: 0,
      heading: 90,
      lastLocationUpdate: new Date(),
    });

    console.log('[Seeder] 2 Fleet Vehicles registered:', vehicle1.plateNumber, vehicle2.plateNumber);

    // 3. Create Smart Bins across Srinagar
    const binDefinitions = [
      {
        binId: 'BIN-SRG-001',
        name: 'Lal Chowk Clock Tower Hub',
        wardName: 'Lal Chowk',
        address: 'Clock Tower Promenade, Lal Chowk',
        location: { type: 'Point', coordinates: [74.8080, 34.0725] },
        currentFillPercent: 88,
        currentWeightKg: 52.4,
        currentTemperatureC: 21.5,
        status: 'URGENT',
      },
      {
        binId: 'BIN-SRG-002',
        name: 'Dalgate Boulevard Ghat 1',
        wardName: 'Dalgate',
        address: 'Boulevard Road, Near Shikara Stand',
        location: { type: 'Point', coordinates: [74.8320, 34.0810] },
        currentFillPercent: 68,
        currentWeightKg: 38.2,
        currentTemperatureC: 22.0,
        status: 'WARNING',
      },
      {
        binId: 'BIN-SRG-003',
        name: 'Hazratbal Market Gate 2',
        wardName: 'Hazratbal',
        address: 'Hazratbal Shrine Perimeter, Gate 2',
        location: { type: 'Point', coordinates: [74.8430, 34.1280] },
        currentFillPercent: 42,
        currentWeightKg: 21.5,
        currentTemperatureC: 20.0,
        status: 'NORMAL',
      },
      {
        binId: 'BIN-SRG-004',
        name: 'Rajbagh Zero Bridge Walkway',
        wardName: 'Rajbagh',
        address: 'Bund Road, Zero Bridge Entrance',
        location: { type: 'Point', coordinates: [74.8210, 34.0670] },
        currentFillPercent: 82,
        currentWeightKg: 49.0,
        currentTemperatureC: 21.0,
        status: 'URGENT',
      },
      {
        binId: 'BIN-SRG-005',
        name: 'Soura SKIMS Hospital Junction',
        wardName: 'Soura',
        address: 'SKIMS Medical Enclave Road',
        location: { type: 'Point', coordinates: [74.8050, 34.1370] },
        currentFillPercent: 30,
        currentWeightKg: 14.8,
        currentTemperatureC: 19.5,
        status: 'NORMAL',
      },
      {
        binId: 'BIN-SRG-006',
        name: 'Karan Nagar Medical College Point',
        wardName: 'Karan Nagar',
        address: 'GMC Hospital Crossing',
        location: { type: 'Point', coordinates: [74.7920, 34.0890] },
        currentFillPercent: 55,
        currentWeightKg: 31.0,
        currentTemperatureC: 20.5,
        status: 'WARNING',
      },
    ];

    const seededBins = [];
    for (const b of binDefinitions) {
      const bin = new SmartBin({
        ...b,
        depthCm: 100,
        capacityLiters: 240,
        lastSeen: new Date(),
      });
      bin.generateDeviceToken();
      await bin.save();
      seededBins.push(bin);

      // Generate realistic time-series sensor readings over past 24h, 7d, 30d
      const now = Date.now();
      const readings = [];
      // 24h hourly points
      for (let h = 24; h >= 1; h -= 2) {
        const fill = Math.max(10, Math.min(100, Math.round(b.currentFillPercent - h * 1.5 + (Math.random() * 6 - 3))));
        const wt = parseFloat((fill * 0.55).toFixed(1));
        readings.push({
          binId: b.binId,
          fillPercent: fill,
          rawDistanceCm: 100 - fill,
          weightKg: wt,
          temperatureC: parseFloat((20 + Math.sin(h) * 3).toFixed(1)),
          recordedAt: new Date(now - h * 60 * 60 * 1000),
        });
      }
      // 7d daily points
      for (let d = 7; d >= 1; d--) {
        const fill = Math.max(15, Math.min(95, Math.round(b.currentFillPercent - d * 4 + (Math.random() * 10 - 5))));
        readings.push({
          binId: b.binId,
          fillPercent: fill,
          rawDistanceCm: 100 - fill,
          weightKg: parseFloat((fill * 0.5).toFixed(1)),
          temperatureC: 21.0,
          recordedAt: new Date(now - d * 24 * 60 * 60 * 1000),
        });
      }
      await SensorReading.insertMany(readings);
    }

    console.log('[Seeder] 6 Smart Bins deployed with historical sensor readings.');

    // 4. Create Active SmartBinAlert for critically full bin
    await SmartBinAlert.create({
      binId: seededBins[0]._id,
      binIdentifier: seededBins[0].binId,
      wardName: seededBins[0].wardName,
      alertType: 'FILL_THRESHOLD_EXCEEDED',
      severity: 'CRITICAL',
      message: `Smart Bin ${seededBins[0].binId} in ${seededBins[0].wardName} is critically full (${seededBins[0].currentFillPercent}%). Immediate pickup required.`,
      currentFillPercent: seededBins[0].currentFillPercent,
      status: 'ACTIVE',
      triggeredAt: new Date(Date.now() - 25 * 60 * 1000),
    });

    console.log('[Seeder] Smart Bin alert seeded.');

    // 5. Create Collection Requests (On-Demand & Special Event)
    await CollectionRequest.create([
      {
        userId: citizenUser._id,
        requestType: 'ON_DEMAND',
        category: 'RECYCLABLE',
        estimatedVolumeKg: 20,
        description: 'Bundled cardboard packaging boxes and clean HDPE plastic bottles',
        pickupAddress: 'Rajbagh Sector 2, Near Bund Gate',
        wardName: 'Rajbagh',
        location: { type: 'Point', coordinates: [74.8210, 34.0670] },
        status: 'REQUESTED',
      },
      {
        userId: citizenUser._id,
        requestType: 'EVENT',
        category: 'ORGANIC',
        estimatedVolumeKg: 120,
        description: 'Community Floral & Organic Gardening Exhibition waste cleanup',
        pickupAddress: 'Polo Ground Pavilion, Lal Chowk',
        wardName: 'Lal Chowk',
        location: { type: 'Point', coordinates: [74.8150, 34.0710] },
        eventDetails: {
          eventName: 'Spring Floral Showcase 2026',
          eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          expectedAttendees: 350,
        },
        status: 'REQUESTED',
      },
      {
        userId: citizenUser._id,
        requestType: 'ON_DEMAND',
        category: 'BULK_RESIDUAL',
        estimatedVolumeKg: 35,
        description: 'Renovation wooden trims and discarded packing styrofoam',
        pickupAddress: 'University Campus Road, Hazratbal',
        wardName: 'Hazratbal',
        location: { type: 'Point', coordinates: [74.8430, 34.1280] },
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    ]);

    console.log('[Seeder] Collection requests seeded.');

    // 6. Create Ward Collection Schedules
    await CollectionSchedule.create([
      {
        wardName: 'Lal Chowk',
        category: 'MIXED',
        collectionDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        timeWindow: { start: '07:00', end: '11:00' },
        assignedVehicleId: vehicle1._id,
        assignedDriverId: driverUser._id,
        frequencyDescription: 'Morning Commercial & Household Sweep',
        isActive: true,
      },
      {
        wardName: 'Rajbagh',
        category: 'RECYCLABLE',
        collectionDays: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
        timeWindow: { start: '08:00', end: '12:00' },
        assignedVehicleId: vehicle1._id,
        assignedDriverId: driverUser._id,
        frequencyDescription: 'Bi-Daily Segregated Dry Waste Collection',
        isActive: true,
      },
      {
        wardName: 'Hazratbal',
        category: 'ORGANIC',
        collectionDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        timeWindow: { start: '06:30', end: '09:30' },
        assignedVehicleId: vehicle2._id,
        frequencyDescription: 'Daily Wet Waste & Pilgrim Corridor Clearance',
        isActive: true,
      },
    ]);

    console.log('[Seeder] Ward collection schedules seeded.');

    // 7. Seed Recycler Directory
    await RecyclerDirectory.create([
      {
        name: 'Valley Green Waste Recyclers',
        category: 'PLASTIC_SCRAP',
        acceptedMaterials: ['PET Bottles', 'HDPE Containers', 'Rigid Plastics'],
        address: 'Plot 14, Industrial Estate Zainakote, Srinagar',
        wardName: 'Batamaloo',
        location: { type: 'Point', coordinates: [74.7500, 34.1000] },
        contactPhone: '+91 9419011223',
        operatingHours: '09:00 AM - 06:00 PM (Mon-Sat)',
        verified: true,
      },
      {
        name: 'Kashmir Bio-Compost Organic Solutions',
        category: 'ORGANIC_COMPOST',
        acceptedMaterials: ['Household Kitchen Waste', 'Fruit Scraps', 'Garden Prunings'],
        address: 'Near Zakura Agro Complex, Srinagar',
        wardName: 'Hazratbal',
        location: { type: 'Point', coordinates: [74.8350, 34.1450] },
        contactPhone: '+91 9419044556',
        operatingHours: '08:30 AM - 05:30 PM (Mon-Fri)',
        verified: true,
      },
    ]);

    console.log('[Seeder] Recycler Directory populated.');

    // 8. Seed Dumping Reports
    await DumpingReport.create([
      {
        citizenId: citizenUser._id,
        photoUrl: '/uploads/sample_dumping_1.jpg',
        location: { type: 'Point', coordinates: [74.8215, 34.0675] },
        address: 'Behind Rajbagh Modern Hospital, Footpath Corner',
        wardName: 'Rajbagh',
        wasteCategory: 'PLASTIC',
        severity: 'HIGH',
        description: 'Large pile of single-use plastic cups and discarded food packaging near water drain.',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        ecoCreditsAwarded: true,
      },
      {
        citizenId: citizenUser._id,
        photoUrl: '/uploads/sample_dumping_2.jpg',
        location: { type: 'Point', coordinates: [74.7820, 34.0820] },
        address: 'Near Bemina Maternity Hospital Ground',
        wardName: 'Bemina',
        wasteCategory: 'CONSTRUCTION',
        severity: 'MEDIUM',
        description: 'Construction debris and mixed plaster bags blocking sidewalk.',
        status: 'SUBMITTED',
      },
    ]);

    console.log('[Seeder] Dumping reports seeded.');

    // 9. Seed P2P Resource Listings (Completed to power waste diversion calculation)
    await ResourceListing.create([
      {
        ownerId: citizenUser._id,
        title: '5 kg Fresh Kitchen Vegetable Scraps (Clean & Uncooked)',
        category: 'ORGANIC_COMPOSTABLE',
        description: 'Potato peels, carrot tops, cabbage leaves - perfect for worm composting or kitchen garden beds.',
        quantity: 5,
        quantityUnit: 'KG',
        address: 'Rajbagh Ext, Srinagar',
        wardName: 'Rajbagh',
        location: { type: 'Point', coordinates: [74.8220, 34.0680] },
        status: 'COMPLETED',
      },
      {
        ownerId: citizenUser._id,
        title: '15 Clean Corrugated Cardboard Shipping Boxes',
        category: 'SCRAP_PAPER_CARDBOARD',
        description: 'Medium and large size sturdy boxes from recent grocery delivery, stored dry indoors.',
        quantity: 15,
        quantityUnit: 'UNITS',
        address: 'Rajbagh, near Flora Hotel',
        wardName: 'Rajbagh',
        location: { type: 'Point', coordinates: [74.8190, 34.0660] },
        status: 'COMPLETED',
      },
    ]);

    console.log('[Seeder] P2P Resource Listings seeded.');

    // 10. Seed Eco-Credit Transaction
    await EcoCreditTransaction.create({
      userId: citizenUser._id,
      activityType: 'VERIFIED_DUMPING_REPORT',
      creditsEarned: 50,
      idempotencyKey: `VERIFIED_DUMPING_REPORT_sample1_${citizenUser._id}`,
      balanceAfter: 120,
      description: 'Reward for verified open-dumping report in Rajbagh',
    });

    console.log('[Seeder] Eco-credit transaction logged.');

    // 11. Seed Household Composting Batches
    await CompostActivity.create([
      {
        citizenId: citizenUser._id,
        wasteType: 'VEGETABLE_SCRAPS',
        quantityKg: 6.5,
        brownMaterialType: 'Dry Chinar Leaves & Cardboard',
        brownQuantityKg: 12.0,
        method: 'HOME_BIN',
        status: 'IN_PROGRESS',
        estimatedMaturityWeeks: 8,
        estimatedMaturityDate: new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000),
        notes: 'Kitchen carrot peels & cabbage scraps layered with autumn Chinar leaves in aerated garden bin.',
        ecoCreditsAwarded: true,
      },
      {
        citizenId: citizenUser._id,
        wasteType: 'FRUIT_WASTE',
        quantityKg: 4.0,
        brownMaterialType: 'Shredded Cardboard & Dry Straw',
        brownQuantityKg: 6.0,
        method: 'VERMICOMPOSTING',
        status: 'COMPLETED',
        estimatedMaturityWeeks: 6,
        estimatedMaturityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Mature, odorless worm humus harvested for rose garden beds.',
        ecoCreditsAwarded: true,
      },
    ]);

    await EcoCreditTransaction.create([
      {
        userId: citizenUser._id,
        activityType: 'COMPOSTING_ACTIVITY',
        creditsEarned: 20,
        idempotencyKey: `COMPOSTING_ACTIVITY_seed1_${citizenUser._id}`,
        balanceAfter: 140,
        description: 'Logged household composting batch (6.5 kg of VEGETABLE SCRAPS)',
      },
      {
        userId: citizenUser._id,
        activityType: 'RESOURCE_EXCHANGE',
        creditsEarned: 1110,
        idempotencyKey: `RESOURCE_EXCHANGE_seedbonus_${citizenUser._id}`,
        balanceAfter: 1250,
        description: 'Initial community resource recovery participation credits',
      },
    ]);

    citizenUser.ecoCredits = 1250;
    citizenUser.updateTier();
    await citizenUser.save();

    console.log('[Seeder] Household Composting Batches seeded (+20 credits awarded).');

    // 12. Seed Verified Recycler Recovery Directory
    await RecyclerDirectory.create([
      {
        name: 'Srinagar Green Scrap Recovery Facility',
        contactPhone: '+91 94190 88123',
        contactEmail: 'greenscrap.srinagar@gmail.com',
        acceptedMaterials: ['Plastic', 'Paper', 'Cardboard', 'Metal Cans', 'Scrap Iron'],
        address: 'Near Old Zero Bridge, Rajbagh',
        wardName: 'Rajbagh',
        location: { type: 'Point', coordinates: [74.8210, 34.0670] },
        operatingHours: 'Mon - Sat: 9:00 AM - 6:30 PM',
        ratesPerKg: { plastic: 18, paper: 14, scrapIron: 28 },
        isVerified: true,
      },
      {
        name: 'Chinar E-Waste & Battery Safe Recovery Point',
        contactPhone: '+91 94190 77456',
        contactEmail: 'ewaste.chinar@kashmir.org',
        acceptedMaterials: ['E-Waste', 'Lithium Batteries', 'Lead-Acid Batteries', 'Cables', 'Printed Circuit Boards'],
        address: 'Habak Crossing, near University Gate, Hazratbal',
        wardName: 'Hazratbal',
        location: { type: 'Point', coordinates: [74.8415, 34.1285] },
        operatingHours: 'Mon - Fri: 10:00 AM - 5:00 PM',
        ratesPerKg: { ewaste: 35, batteries: 45 },
        isVerified: true,
      },
      {
        name: 'Valley Bio-Organic Composting & Mulch Hub',
        contactPhone: '+91 94190 66321',
        acceptedMaterials: ['Organic Waste', 'Dry Leaves', 'Garden Trimmings', 'Sawdust'],
        address: 'Bypass Road, near Fruit Mandi, Bemina',
        wardName: 'Bemina',
        location: { type: 'Point', coordinates: [74.7810, 34.0790] },
        operatingHours: 'Mon - Sat: 8:30 AM - 5:30 PM',
        ratesPerKg: { dryLeaves: 5, bioOrganic: 8 },
        isVerified: true,
      },
    ]);

    console.log('[Seeder] Recycler Directory facilities seeded.');

    // 13. Seed Rewards Marketplace Products
    await Product.create([
      {
        name: 'Segregated Dual Bin Set (60L Total)',
        description: 'Colour-coded heavy-duty HDPE bins (30L Blue for Dry/Recyclables, 30L Green for Kitchen Organics) with foot-pedal lids.',
        category: 'SEGREGATION_BINS',
        moneyPrice: 1299,
        ecoCreditPrice: 800,
        stock: 25,
        vendor: 'SMC Waste Reduction Mission',
        status: 'ACTIVE',
      },
      {
        name: 'Home Aerobic Composting Kit (20L)',
        description: 'Complete indoor kitchen composter with aerated tap, microbial accelerator bokashi bran (1kg), and easy turning handle.',
        category: 'COMPOSTING_KITS',
        moneyPrice: 899,
        ecoCreditPrice: 550,
        stock: 18,
        vendor: 'Kashmir Organic Collective',
        status: 'ACTIVE',
      },
      {
        name: 'Heavy-Duty Reusable Jute Waste Bags (Pack of 3)',
        description: 'Eco-friendly washable natural jute bags with reinforced handles, ideal for dry recyclable collection and zero-plastic shopping.',
        category: 'REUSABLE_BAGS',
        moneyPrice: 299,
        ecoCreditPrice: 200,
        stock: 45,
        vendor: 'Crafts Kashmir Guild',
        status: 'ACTIVE',
      },
      {
        name: '100% Biodegradable Cornstarch Bin Liners (50 Bags)',
        description: 'Certified compostable bin liners made from non-GMO cornstarch. Decomposes within 90 days in municipal or home compost.',
        category: 'ECO_HOUSEHOLD',
        moneyPrice: 249,
        ecoCreditPrice: 180,
        stock: 35,
        vendor: 'EcoCycle Srinagar Store',
        status: 'ACTIVE',
      },
      {
        name: 'Stainless Steel Spiral Compost Aerator Fork',
        description: 'Ergonomic spiral aerator tool to easily introduce oxygen into the center of your compost pile without heavy shovelling.',
        category: 'GARDENING',
        moneyPrice: 450,
        ecoCreditPrice: 300,
        stock: 20,
        vendor: 'Valley Agri Tools',
        status: 'ACTIVE',
      },
    ]);

    console.log('[Seeder] Rewards Marketplace products seeded.');

    // 14. Seed Default System Reward Configuration
    await SystemSetting.create({
      key: 'DEFAULT_REWARD_CONFIG',
      compostingPoints: 20,
      dumpingReportPoints: 50,
      recyclingDropOffPoints: 30,
      resourceExchangePoints: 25,
      sourceSegregationPoints: 15,
    });

    console.log('[Seeder] Default Reward Configuration seeded.');
    console.log('=======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Credentials Summary for Viva Testing:');
    console.log(`👤 Super Admin: ${superAdminUser.email} (Passwordless / OTP)`);
    console.log('👤 Admin:       admin@ecocycle.local   (Passwordless / OTP)');
    console.log('👤 Driver:      driver@ecocycle.local  (Passwordless / OTP)');
    console.log('👤 Citizen:     citizen@ecocycle.local / Citizen@123');
    console.log('=======================================================');
  } catch (error) {
    console.error('[Seeder] Seeding failed with error:', error);
  } finally {
    await disconnectDB();
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
