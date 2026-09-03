const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User, EcoCreditTransaction, SmartBin, ResourceListing } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
  await EcoCreditTransaction.init();
  await SmartBin.init();
  await ResourceListing.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await EcoCreditTransaction.deleteMany({});
  await SmartBin.deleteMany({});
  await ResourceListing.deleteMany({});
});

describe('Eco-Credits Ledger, Leaderboard & Waste Diversion (Milestone 8)', () => {
  let citizenUser;
  let citizenToken;

  beforeEach(async () => {
    citizenUser = await User.create({
      name: 'Faisal Wani',
      email: 'faisal_credits@test.local',
      password: 'Password123',
      role: 'CITIZEN',
      wardName: 'Rajbagh',
      ecoCredits: 125,
      tier: 'SILVER',
    });
    citizenToken = citizenUser.generateAuthToken();

    await EcoCreditTransaction.create({
      userId: citizenUser._id,
      activityType: 'SOURCE_SEGREGATION',
      creditsEarned: 10,
      idempotencyKey: `TEST_TX_1_${citizenUser._id}`,
      balanceAfter: 10,
      description: 'Scanned plastic bottle',
    });

    await EcoCreditTransaction.create({
      userId: citizenUser._id,
      activityType: 'RESOURCE_EXCHANGE',
      creditsEarned: 25,
      idempotencyKey: `TEST_TX_2_${citizenUser._id}`,
      balanceAfter: 35,
      description: 'Completed P2P carton exchange',
    });
  });

  it('GET /api/v1/credits/ledger should return user transaction history', async () => {
    const res = await request(app)
      .get('/api/v1/credits/ledger')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.currentBalance).toBe(125);
    expect(res.body.currentTier).toBe('SILVER');
    expect(res.body.data[0].idempotencyKey).toBeDefined();
  });

  it('GET /api/v1/credits/leaderboard should rank citizens by eco-credits', async () => {
    await User.create({
      name: 'Top Champion',
      email: 'champion@test.local',
      password: 'Password123',
      role: 'CITIZEN',
      wardName: 'Lal Chowk',
      ecoCredits: 550,
      tier: 'ECO_CHAMPION',
    });

    const res = await request(app).get('/api/v1/credits/leaderboard');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.data[0].displayName).toBe('Top C.');
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[0].ecoCredits).toBe(550);
  });

  it('GET /api/v1/analytics/diversion should calculate scientific diversion formula with data transparency', async () => {
    // Seed 1 smart bin with 40 kg measured load
    await SmartBin.create({
      binId: 'BIN_DIV_01',
      name: 'Diversion Bin',
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.82, 34.06] },
      currentWeightKg: 40,
    });

    // Seed 1 completed resource listing with 10 kg compostable waste
    await ResourceListing.create({
      ownerId: citizenUser._id,
      title: 'Diverted Organic Scraps',
      category: 'ORGANIC_COMPOSTABLE',
      quantity: 10,
      quantityUnit: 'KG',
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.82, 34.06] },
      status: 'COMPLETED',
    });

    const res = await request(app).get('/api/v1/analytics/diversion');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.diversionRatePercent).toBeDefined();
    expect(typeof res.body.data.diversionRatePercent).toBe('number');
    expect(res.body.data.dataSources.measuredData.badge).toBe('Hardware Measured Data');
    expect(res.body.data.dataSources.citizenEstimates.badge).toBe('Citizen-Reported Estimates');
    expect(res.body.data.breakdownKg).toBeDefined();
  });
});
