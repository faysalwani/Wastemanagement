const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User, SmartBin, DumpingReport, EcoCreditTransaction, Vehicle } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
  await SmartBin.init();
  await DumpingReport.init();
  await EcoCreditTransaction.init();
  await Vehicle.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await SmartBin.deleteMany({});
  await DumpingReport.deleteMany({});
  await EcoCreditTransaction.deleteMany({});
  await Vehicle.deleteMany({});
});

describe('IoT, GIS Reports, Route Optimization & Proximity Radar (Milestones 9-13)', () => {
  let citizenUser;
  let citizenToken;
  let adminUser;
  let adminToken;
  let driverUser;
  let driverToken;
  let testBin;

  beforeEach(async () => {
    citizenUser = await User.create({
      name: 'Citizen Srinagar',
      email: 'citizen_geo@test.local',
      password: 'Password123',
      role: 'CITIZEN',
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.8210, 34.0670] },
      ecoCredits: 0,
    });
    citizenToken = citizenUser.generateAuthToken();

    adminUser = await User.create({
      name: 'Admin Municipal',
      email: 'admin_geo@test.local',
      password: 'Password123',
      role: 'ADMIN',
    });
    adminToken = adminUser.generateAuthToken();

    driverUser = await User.create({
      name: 'Driver Srinagar',
      email: 'driver_geo@test.local',
      password: 'Password123',
      role: 'DRIVER',
    });
    driverToken = driverUser.generateAuthToken();

    testBin = new SmartBin({
      binId: 'TEST_BIN_01',
      name: 'Test Smart Bin',
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.8200, 34.0665] },
      depthCm: 100,
      currentFillPercent: 20,
    });
    testBin.generateDeviceToken();
    await testBin.save();
  });

  // Milestone 9: IoT Telematics Ingestion
  it('POST /api/v1/iot/telemetry should ingest ultrasonic reading and compute fill %', async () => {
    const res = await request(app)
      .post('/api/v1/iot/telemetry')
      .send({
        binId: 'TEST_BIN_01',
        rawDistanceCm: 15, // 100cm depth - 15cm distance = 85% fill -> URGENT
        weightKg: 35.5,
        temperatureC: 22.4,
        batteryPercent: 92,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fillPercent).toBe(85);
    expect(res.body.data.status).toBe('URGENT');

    const updated = await SmartBin.findOne({ binId: 'TEST_BIN_01' });
    expect(updated.currentFillPercent).toBe(85);
    expect(updated.status).toBe('URGENT');
  });

  // Milestone 11: GIS Open-Dumping & Hotspot Clustering
  it('POST /api/v1/reports should register dumping complaint and GET /hotspots should cluster nearby reports', async () => {
    // Submit 2 reports within 100m of each other
    await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        wasteCategory: 'MIXED_MUNICIPAL',
        severity: 'HIGH',
        wardName: 'Batamaloo',
        address: 'Batamaloo Bus Stand',
        coordinates: [74.7900, 34.0700],
      });

    await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        wasteCategory: 'PLASTIC_POLLUTION',
        severity: 'MEDIUM',
        wardName: 'Batamaloo',
        address: 'Near Old Bus Stand Gate',
        coordinates: [74.7910, 34.0705],
      });

    // Check Hotspots endpoint
    const hotRes = await request(app).get('/api/v1/reports/hotspots');
    expect(hotRes.statusCode).toBe(200);
    expect(hotRes.body.success).toBe(true);
    expect(hotRes.body.count).toBe(1);
    expect(hotRes.body.data[0].incidentCount).toBe(2);
    expect(hotRes.body.data[0].wardName).toBe('Batamaloo');
  });

  // Milestone 11: Admin Verification & +50 Eco-Credits
  it('PATCH /api/v1/reports/:id/verify should award +50 eco-credits to citizen', async () => {
    const report = await DumpingReport.create({
      citizenId: citizenUser._id,
      wardName: 'Rajbagh',
      address: 'Bund Road',
      location: { type: 'Point', coordinates: [74.821, 34.067] },
      status: 'SUBMITTED',
    });

    const res = await request(app)
      .patch(`/api/v1/reports/${report._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'VERIFIED' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.creditsAwarded).toBe(50);

    const updatedCitizen = await User.findById(citizenUser._id);
    expect(updatedCitizen.ecoCredits).toBe(50);
  });

  // Milestone 12: Route Optimization Solver
  it('GET /api/v1/routes/optimize should return ordered manifest and fuel savings', async () => {
    // Mark testBin as urgent (90%)
    testBin.currentFillPercent = 90;
    testBin.status = 'URGENT';
    await testBin.save();

    const res = await request(app).get('/api/v1/routes/optimize');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.totalStops).toBeGreaterThanOrEqual(1);
    expect(res.body.summary.fuelSavedLiters).toBeDefined();
    expect(res.body.summary.benchmarkTag).toContain('Simulated Path');
  });

  // Milestone 13: Live Driver Tracking & 500m Proximity Radar
  it('POST /api/v1/tracking/update should update vehicle location and trigger proximity alert', async () => {
    const vehicle = await Vehicle.create({
      vehicleId: 'VEH_TEST_01',
      plateNumber: 'JK-01-AB-1234',
      type: 'COMPACTOR',
      driverId: driverUser._id,
      currentLocation: { type: 'Point', coordinates: [74.808, 34.072] },
      status: 'AVAILABLE',
    });

    // Driver coordinates within 200m of citizen (citizen is at [74.8210, 34.0670])
    const nearbyCoords = [74.8215, 34.0672];

    const res = await request(app)
      .post('/api/v1/tracking/update')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId: 'VEH_TEST_01',
        coordinates: nearbyCoords,
        speedKmph: 25,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.proximityAlertsTriggered).toBe(1);
  });
});
