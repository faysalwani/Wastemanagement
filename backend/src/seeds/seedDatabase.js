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

    console.log('[Seeder] Creating standard system users...');

    // 1. Create Core Users
    const superAdminUser = await User.create({
      name: process.env.SUPER_ADMIN_NAME || 'Central Super Administrator',
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@ecocycle.local',
      role: 'SUPER_ADMIN', // No password for Super Admin (OTP Only)
      phone: process.env.SUPER_ADMIN_PHONE || '+91 9419000000',
      wardName: process.env.SUPER_ADMIN_WARD || 'Lal Chowk',
      address: 'SMC Directorate, Srinagar',
      location: { type: 'Point', coordinates: [74.8080, 34.0725] },
      ecoCredits: 1000,
      tier: 'ECO_CHAMPION',
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
    });

    console.log('[Seeder] Users created successfully.');

    // 2. Create Collection Vehicle assigned to Driver
    const vehicle = await Vehicle.create({
      vehicleNumber: 'JK-01-WM-2026',
      model: 'Tata Ace Mini Compactor (Electric)',
      capacityKg: 1200,
      driverId: driverUser._id,
      isActive: true,
      currentLocation: { type: 'Point', coordinates: [74.8080, 34.0725] },
      speedKmh: 22,
      heading: 45,
      lastLocationUpdate: new Date(),
    });

    console.log('[Seeder] Vehicle registered:', vehicle.vehicleNumber);

    // 3. Create Smart Bins across Srinagar
    const binsConfig = [
      {
        binId: 'BIN_SRG_01',
        name: 'Lal Chowk Clock Tower Hub',
        wardName: 'Lal Chowk',
        address: 'Near Ghanta Ghar, Residency Road',
        coordinates: [74.8080, 34.0725],
        fill: 88,
        weight: 38.5,
        temp: 21.2,
        status: 'URGENT',
      },
      {
        binId: 'BIN_SRG_02',
        name: 'Rajbagh River View Bin',
        wardName: 'Rajbagh',
        address: 'Near Zero Bridge, Jhelum Bund',
        coordinates: [74.8210, 34.0670],
        fill: 42,
        weight: 16.0,
        temp: 19.8,
        status: 'NORMAL',
      },
      {
        binId: 'BIN_SRG_03',
        name: 'Hazratbal Shrine Market Bin',
        wardName: 'Hazratbal',
        address: 'Outer Market Circle, Hazratbal',
        coordinates: [74.8430, 34.1275],
        fill: 76,
        weight: 31.2,
        temp: 22.4,
        status: 'WARNING',
      },
      {
        binId: 'BIN_SRG_04',
        name: 'Bemina Bypass Commercial Hub',
        wardName: 'Bemina',
        address: 'National Highway Bypass Junction',
        coordinates: [74.7760, 34.0790],
        fill: 92,
        weight: 44.0,
        temp: 24.1,
        status: 'URGENT',
      },
      {
        binId: 'BIN_SRG_05',
        name: 'Nishat Garden Public Promenade',
        wardName: 'Nishat',
        address: 'Foreshore Road Entrance',
        coordinates: [74.8820, 34.1220],
        fill: 35,
        weight: 12.8,
        temp: 18.5,
        status: 'NORMAL',
      },
      {
        binId: 'BIN_SRG_06',
        name: 'Soura SKIMS Hospital Access Bin',
        wardName: 'Soura',
        address: '90 Feet Road Junction, Soura',
        coordinates: [74.8050, 34.1350],
        fill: 65,
        weight: 27.4,
        temp: 20.6,
        status: 'WARNING',
      },
    ];

    for (const b of binsConfig) {
      const bin = new SmartBin({
        binId: b.binId,
        name: b.name,
        wardName: b.wardName,
        address: b.address,
        location: { type: 'Point', coordinates: b.coordinates },
        capacityLiters: 240,
        depthCm: 100,
        currentFillPercent: b.fill,
        currentWeightKg: b.weight,
        currentTemperatureC: b.temp,
        batteryPercent: 95,
        status: b.status,
        lastSeen: new Date(),
      });
      // Generate secure token for simulation/ESP32
      const rawToken = bin.generateDeviceToken();
      await bin.save();

      // Seed an initial sensor reading
      await SensorReading.create({
        binId: b.binId,
        fillPercent: b.fill,
        rawDistanceCm: Math.round(100 - b.fill),
        weightKg: b.weight,
        temperatureC: b.temp,
        batteryPercent: 95,
        recordedAt: new Date(),
      });
    }

    console.log(`[Seeder] ${binsConfig.length} Smart Bins deployed across Srinagar.`);

    // 4. Create Verified Recyclers Directory
    await RecyclerDirectory.create([
      {
        name: 'Srinagar Green Scrap & Plastic Recovery',
        contactPhone: '+91 9419112233',
        contactEmail: 'greenscrap@srinagar.org',
        acceptedMaterials: ['Plastic', 'PET Bottles', 'Cardboard', 'Aluminium Cans'],
        address: 'Industrial Estate, Zainakote, Srinagar',
        wardName: 'Batamaloo',
        location: { type: 'Point', coordinates: [74.7550, 34.0950] },
        operatingHours: 'Mon-Sat: 8:30 AM - 6:30 PM',
        isVerified: true,
      },
      {
        name: 'Kashmir Valley E-Waste Recycling Center',
        contactPhone: '+91 9419223344',
        contactEmail: 'info@kashmirewaste.com',
        acceptedMaterials: ['E-Waste', 'Lithium Batteries', 'Computer Parts', 'Cables'],
        address: 'SIDCO Electronics Complex, Rangreth',
        wardName: 'Rajbagh',
        location: { type: 'Point', coordinates: [74.8050, 34.0210] },
        operatingHours: 'Mon-Fri: 9:00 AM - 5:00 PM',
        isVerified: true,
      },
      {
        name: 'Dal Lake Bio-Composting Collective',
        contactPhone: '+91 9419334455',
        contactEmail: 'dallakecompost@jk.gov.in',
        acceptedMaterials: ['Organic Waste', 'Vegetable Scraps', 'Garden Leaves'],
        address: 'Near Nehru Park, Boulevard Road',
        wardName: 'Nishat',
        location: { type: 'Point', coordinates: [74.8550, 34.0880] },
        operatingHours: 'Daily: 7:00 AM - 4:00 PM',
        isVerified: true,
      },
    ]);

    console.log('[Seeder] Recycler Directory populated.');

    // 5. Create Sample Open-Dumping Reports
    await DumpingReport.create([
      {
        citizenId: citizenUser._id,
        photoUrl: '/uploads/sample_dumping_1.jpg',
        location: { type: 'Point', coordinates: [74.8150, 34.0760] },
        address: 'Canal Bank Road, Rajbagh',
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

    // 6. Create Sample P2P Resource Listings
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
        status: 'AVAILABLE',
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
        status: 'AVAILABLE',
      },
    ]);

    console.log('[Seeder] P2P Resource Listings seeded.');

    // 7. Create Sample Eco-Credit Transaction
    await EcoCreditTransaction.create({
      userId: citizenUser._id,
      activityType: 'VERIFIED_DUMPING_REPORT',
      creditsEarned: 50,
      idempotencyKey: `VERIFIED_DUMPING_REPORT_sample1_${citizenUser._id}`,
      balanceAfter: 120,
      description: 'Reward for verified open-dumping report in Rajbagh',
      timestamp: new Date(),
    });

    console.log('[Seeder] Eco-credit transaction logged.');
    console.log('=======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Credentials Summary for Viva Testing:');
    console.log('👤 Admin:   admin@ecocycle.local   / Admin@123');
    console.log('👤 Driver:  driver@ecocycle.local  / Driver@123');
    console.log('👤 Citizen: citizen@ecocycle.local / Citizen@123');
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
