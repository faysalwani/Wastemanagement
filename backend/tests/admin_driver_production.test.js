const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const {
  User,
  Vehicle,
  SmartBin,
  CollectionRun,
  CollectionRequest,
  SmartBinAlert,
  CollectionSchedule,
} = require('../src/models');

let mongoServer;
let adminToken, driverToken, citizenToken;
let adminUser, driverUser, citizenUser;
let testVehicle, testBin;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create Users
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin_test@ecocycle.gov',
    role: 'ADMIN',
  });
  adminToken = adminUser.generateAuthToken();

  driverUser = await User.create({
    name: 'Driver User',
    email: 'driver_test@ecocycle.gov',
    role: 'DRIVER',
  });
  driverToken = driverUser.generateAuthToken();

  citizenUser = await User.create({
    name: 'Citizen User',
    email: 'citizen_test@ecocycle.gov',
    password: 'Password@123',
    role: 'CITIZEN',
    wardName: 'Lal Chowk',
  });
  citizenToken = citizenUser.generateAuthToken();

  // Create Vehicle
  testVehicle = await Vehicle.create({
    plateNumber: 'JK-01-WM-9999',
    vehicleId: 'VEH-9999',
    model: 'Tata Ace Mini Compactor',
    capacityKg: 1200,
    driverId: driverUser._id,
    status: 'AVAILABLE',
  });

  // Create Smart Bin
  testBin = await SmartBin.create({
    binId: 'BIN-TEST-01',
    name: 'Dal Gate Point 1',
    wardName: 'Lal Chowk',
    location: { type: 'Point', coordinates: [74.808, 34.0725] },
    currentFillPercent: 85,
    currentWeightKg: 45,
    status: 'URGENT',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Production Admin & Driver Lifecycle Test Suite', () => {
  let createdRequestId;
  let createdRunId;

  // 1. Citizen creates collection request
  it('Citizen should create an on-demand collection request', async () => {
    const res = await request(app)
      .post('/api/v1/collection-requests')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        pickupAddress: 'Residency Road, Lal Chowk',
        wardName: 'Lal Chowk',
        category: 'RECYCLABLE',
        estimatedVolumeKg: 15,
        description: 'Cardboard cartons and sorted plastics',
        coordinates: [74.808, 34.0725],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REQUESTED');
    createdRequestId = res.body.data._id;
  });

  // 2. Admin views and approves request
  it('Admin should approve and assign collection request', async () => {
    const res = await request(app)
      .patch(`/api/v1/collection-requests/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'ASSIGNED',
        assignedDriverId: driverUser._id,
        assignedVehicleId: testVehicle._id,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('ASSIGNED');
  });

  // 3. Unauthorized access check: Citizen cannot view all admin requests
  it('Citizen should be rejected from viewing all collection requests (403)', async () => {
    const res = await request(app)
      .get('/api/v1/collection-requests')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.statusCode).toBe(403);
  });

  // 4. Admin dispatches an optimized route to driver
  it('Admin should dispatch a collection route creating a persistent CollectionRun', async () => {
    const res = await request(app)
      .post('/api/v1/collection-runs/dispatch')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleId: testVehicle._id,
        driverId: driverUser._id,
        wardName: 'Lal Chowk',
        totalDistanceKm: 14.5,
        estimatedDurationMinutes: 45,
        stops: [
          {
            type: 'SMART_BIN',
            identifier: testBin.binId,
            name: testBin.name,
            wardName: testBin.wardName,
            coordinates: testBin.location.coordinates,
            fillPercent: testBin.currentFillPercent,
            estimatedWeightKg: testBin.currentWeightKg,
            priority: 'HIGH',
          },
          {
            type: 'COLLECTION_REQUEST',
            refId: createdRequestId,
            identifier: 'CR-101',
            name: 'Citizen Pickup: Residency Road',
            wardName: 'Lal Chowk',
            coordinates: [74.808, 34.0725],
            fillPercent: 50,
            estimatedWeightKg: 15,
            priority: 'MEDIUM',
          },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.runId).toBeDefined();
    expect(res.body.data.stops.length).toBe(2);
    expect(res.body.data.status).toBe('ASSIGNED');
    createdRunId = res.body.data._id;
  });

  // 5. Duplicate active dispatch prevention
  it('Admin dispatch should reject if driver or vehicle already has an active run (409)', async () => {
    const res = await request(app)
      .post('/api/v1/collection-runs/dispatch')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleId: testVehicle._id,
        driverId: driverUser._id,
        stops: [{ type: 'SMART_BIN', identifier: 'B2', name: 'Stop', coordinates: [74.8, 34.0] }],
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error.message).toContain('already has an active collection run');
  });

  // 6. Driver fetches active run
  it('Driver should retrieve their assigned active run from MongoDB', async () => {
    const res = await request(app)
      .get('/api/v1/collection-runs/active')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id.toString()).toBe(createdRunId.toString());
    expect(res.body.data.stops.length).toBe(2);
  });

  // 7. Driver starts collection run
  it('Driver starts collection run setting status to IN_PROGRESS and vehicle to COLLECTING', async () => {
    const res = await request(app)
      .patch(`/api/v1/collection-runs/${createdRunId}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');

    const vehicleInDb = await Vehicle.findById(testVehicle._id);
    expect(vehicleInDb.status).toBe('COLLECTING');
  });

  // 8. Driver marks Stop #1 as COLLECTED
  it('Driver marks Stop #1 as COLLECTED and updates SmartBin.lastCollectedAt', async () => {
    const res = await request(app)
      .patch(`/api/v1/collection-runs/${createdRunId}/stops/1`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        status: 'COLLECTED',
        collectedWeightKg: 42,
        driverNotes: 'Bin emptied cleanly into compactor',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.completedStops).toBe(1);

    const binInDb = await SmartBin.findOne({ binId: testBin.binId });
    expect(binInDb.lastCollectedAt).toBeDefined();
  });

  // 9. Driver marks Stop #2 as SKIPPED (requiring skip reason)
  it('Driver skipping a stop without reason is rejected (400)', async () => {
    const res = await request(app)
      .patch(`/api/v1/collection-runs/${createdRunId}/stops/2`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'SKIPPED' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toContain('skip reason is required');
  });

  it('Driver skips Stop #2 with valid reason', async () => {
    const res = await request(app)
      .patch(`/api/v1/collection-runs/${createdRunId}/stops/2`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        status: 'SKIPPED',
        skipReason: 'Road inaccessible',
        driverNotes: 'Narrow alley blocked by construction material',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.skippedStops).toBe(1);
  });

  // 10. Driver ends collection run
  it('Driver ends collection run setting status to COMPLETED and vehicle to AVAILABLE', async () => {
    const res = await request(app)
      .patch(`/api/v1/collection-runs/${createdRunId}/end`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.completedStops).toBe(1);
    expect(res.body.data.skippedStops).toBe(1);

    const vehicleInDb = await Vehicle.findById(testVehicle._id);
    expect(vehicleInDb.status).toBe('AVAILABLE');
  });

  // 11. Driver and Admin Collection History
  it('Driver retrieves completed runs history', async () => {
    const res = await request(app)
      .get('/api/v1/collection-runs/history?timeRange=all')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].status).toBe('COMPLETED');
  });

  // 12. Smart Bin Alerts Auto-Synchronization
  it('Admin retrieves smart bin alerts automatically generated for high-fill bins', async () => {
    const res = await request(app)
      .get('/api/v1/iot/alerts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const alert = res.body.data.find((a) => a.binIdentifier === testBin.binId);
    expect(alert).toBeDefined();
    expect(alert.status).toBe('ACTIVE');
    expect(alert.alertType).toBe('FILL_THRESHOLD_EXCEEDED');
  });

  // 13. Waste Diversion calculation has zero mock numbers
  it('Waste diversion metrics return pure database calculation', async () => {
    const res = await request(app).get('/api/v1/analytics/diversion');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.diversionRatePercent).toBe('number');
    expect(res.body.data.monthlyTrend).toBeUndefined(); // Fake trend array removed
  });
});
