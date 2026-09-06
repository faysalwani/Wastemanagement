const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const {
  User,
  CompostActivity,
  EcoCreditTransaction,
  ResourceListing,
  DumpingReport,
  SmartBin,
} = require('../src/models');

let mongoServer;
let citizenAToken, citizenBToken, driverToken, adminToken;
let citizenA, citizenB, driverUser, adminUser;
let testBin;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  citizenA = await User.create({
    name: 'Faisal Citizen A',
    email: 'citizen_a@ecocycle.gov',
    password: 'Password@123',
    role: 'CITIZEN',
    wardName: 'Rajbagh',
    ecoCredits: 50,
  });
  citizenAToken = citizenA.generateAuthToken();

  citizenB = await User.create({
    name: 'Zahoor Citizen B',
    email: 'citizen_b@ecocycle.gov',
    password: 'Password@123',
    role: 'CITIZEN',
    wardName: 'Lal Chowk',
    ecoCredits: 20,
  });
  citizenBToken = citizenB.generateAuthToken();

  driverUser = await User.create({
    name: 'Tariq Driver',
    email: 'driver_test@ecocycle.gov',
    role: 'DRIVER',
  });
  driverToken = driverUser.generateAuthToken();

  adminUser = await User.create({
    name: 'Admin Municipal',
    email: 'admin_test@ecocycle.gov',
    role: 'ADMIN',
  });
  adminToken = adminUser.generateAuthToken();

  testBin = await SmartBin.create({
    binId: 'BIN-RAJ-01',
    name: 'Rajbagh Zero Bridge Point',
    wardName: 'Rajbagh',
    location: { type: 'Point', coordinates: [74.821, 34.067] },
    currentFillPercent: 45,
    currentWeightKg: 20,
    status: 'NORMAL',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Production Citizen & Composting Module Test Suite', () => {
  let createdBatchId;
  let createdListingId;
  let createdReportId;

  // 1. Citizen Dashboard Summary (Zero Mock Data)
  it('Citizen should retrieve consolidated personal dashboard summary', async () => {
    const res = await request(app)
      .get('/api/v1/credits/citizen-summary')
      .set('Authorization', `Bearer ${citizenAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Faisal Citizen A');
    expect(res.body.data.user.wardName).toBe('Rajbagh');
    expect(res.body.data.user.ecoCredits).toBe(50);
    expect(res.body.data.wardSmartBins.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.personalDivertedKg).toBe(0);
  });

  // 2. Composting Recommendation Engine
  it('Should generate scientific composting advice with Kashmir context', async () => {
    const res = await request(app)
      .post('/api/v1/compost/recommend')
      .send({
        wasteType: 'LEAVES_CHINAR',
        quantityKg: 5,
        method: 'HOME_BIN',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendation.isSuitable).toBe(true);
    expect(res.body.data.recommendation.preparation).toContain('Chinar leaves');
    expect(res.body.data.recommendation.processTimeline).toContain('Srinagar ambient temperature');
  });

  // 3. Reject invalid composting inputs
  it('Should reject negative or zero composting quantity (400)', async () => {
    const res = await request(app)
      .post('/api/v1/compost/activities')
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({
        wasteType: 'VEGETABLE_SCRAPS',
        quantityKg: -3,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toContain('greater than 0');
  });

  it('Should reject excessive composting quantity (>200 kg) (400)', async () => {
    const res = await request(app)
      .post('/api/v1/compost/activities')
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({
        wasteType: 'VEGETABLE_SCRAPS',
        quantityKg: 350,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toContain('cannot exceed 200 kg');
  });

  // 4. Create Composting Activity & Award +20 Eco-Credits
  it('Citizen should log composting batch and automatically receive +20 Eco-Credits', async () => {
    const res = await request(app)
      .post('/api/v1/compost/activities')
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({
        wasteType: 'VEGETABLE_SCRAPS',
        quantityKg: 4.5,
        brownMaterialType: 'Dry Chinar Leaves & Cardboard',
        brownQuantityKg: 8.0,
        method: 'HOME_BIN',
        notes: 'Kitchen carrot peels, cabbage leaves and crushed eggshells',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('STARTED');
    expect(res.body.data.ecoCreditsAwarded).toBe(true);
    createdBatchId = res.body.data._id;

    // Check user balance updated (50 + 20 = 70)
    const updatedUser = await User.findById(citizenA._id);
    expect(updatedUser.ecoCredits).toBe(70);

    // Verify ledger entry
    const tx = await EcoCreditTransaction.findOne({ referenceId: createdBatchId.toString() });
    expect(tx).toBeDefined();
    expect(tx.creditsEarned).toBe(20);
    expect(tx.activityType).toBe('COMPOSTING_ACTIVITY');
  });

  // 5. Query citizen composting batches
  it('Citizen should retrieve own logged composting activities', async () => {
    const res = await request(app)
      .get('/api/v1/compost/activities')
      .set('Authorization', `Bearer ${citizenAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.totalCompostedKg).toBe(4.5);
  });

  // 6. Update composting batch status
  it('Citizen should update batch status to IN_PROGRESS and COMPLETED', async () => {
    const res = await request(app)
      .patch(`/api/v1/compost/activities/${createdBatchId}/status`)
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({
        status: 'IN_PROGRESS',
        notes: 'Turned pile. Internal temperature warm, no bad odors.',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  // 7. Ownership Security: Citizen B cannot modify Citizen A's batch
  it('Citizen B should be forbidden from modifying Citizen A batch (403)', async () => {
    const res = await request(app)
      .patch(`/api/v1/compost/activities/${createdBatchId}/status`)
      .set('Authorization', `Bearer ${citizenBToken}`)
      .send({ status: 'CANCELLED' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.message).toContain('Unauthorized');
  });

  // 8. Resource Exchange: Create & Query My Listings
  it('Citizen should create resource listing and query own listings', async () => {
    const createRes = await request(app)
      .post('/api/v1/exchange/listings')
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({
        title: '6 Clean Glass Honey Jars',
        category: 'REUSABLE_CONTAINER',
        quantity: 6,
        quantityUnit: 'UNITS',
        wardName: 'Rajbagh',
        address: 'Rajbagh Sector 2',
      });

    expect(createRes.statusCode).toBe(201);
    createdListingId = createRes.body.data._id;

    const myRes = await request(app)
      .get('/api/v1/exchange/my-listings')
      .set('Authorization', `Bearer ${citizenAToken}`);

    expect(myRes.statusCode).toBe(200);
    expect(myRes.body.counts.available).toBeGreaterThanOrEqual(1);
  });

  // 9. Dumping Reports: Create & Query My Reports
  it('Citizen should submit dumping report and query own submissions', async () => {
    const createRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({
        wardName: 'Rajbagh',
        wasteCategory: 'PLASTIC',
        severity: 'HIGH',
        description: 'Single-use plastic bottles dumped along footpath',
        address: 'Near Bund, Rajbagh',
        coordinates: [74.821, 34.067],
      });

    expect(createRes.statusCode).toBe(201);
    createdReportId = createRes.body.data._id;

    const myReportsRes = await request(app)
      .get('/api/v1/reports/my')
      .set('Authorization', `Bearer ${citizenAToken}`);

    expect(myReportsRes.statusCode).toBe(200);
    expect(myReportsRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(myReportsRes.body.data[0].status).toBe('SUBMITTED');
  });

  // 10. Security: Citizen cannot verify own dumping report (403)
  it('Citizen should be rejected from verifying own report (403)', async () => {
    const res = await request(app)
      .patch(`/api/v1/reports/${createdReportId}/verify`)
      .set('Authorization', `Bearer ${citizenAToken}`);

    expect(res.statusCode).toBe(403);
  });

  // 11. Security: Cross-Role Denial: Citizen cannot access fleet vehicle registration (403)
  it('Citizen cannot access administrative fleet creation (403)', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({ plateNumber: 'JK-01-WM-0000' });

    expect(res.statusCode).toBe(403);
  });

  // 12. Security: Profile Update Ignores Role / Credits Tampering
  it('Profile update should update name and ward but ignore role and ecoCredits injection', async () => {
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${citizenAToken}`)
      .send({
        name: 'Faisal Wani Updated',
        wardName: 'Rajbagh Ext',
        role: 'ADMIN', // malicious attempt to escalate
        ecoCredits: 999999, // malicious attempt to inflate credits
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Faisal Wani Updated');
    expect(res.body.user.wardName).toBe('Rajbagh Ext');
    expect(res.body.user.role).toBe('CITIZEN'); // role preserved
    expect(res.body.user.ecoCredits).toBe(70); // credits preserved
  });
});
