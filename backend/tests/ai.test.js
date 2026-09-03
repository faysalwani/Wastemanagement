const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User, EcoCreditTransaction } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
  await EcoCreditTransaction.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await EcoCreditTransaction.deleteMany({});
});

describe('AI Classification & Upload Pipeline (Milestone 5)', () => {
  it('GET /api/v1/ai/status should return 200 OK and list 9 standard classes', async () => {
    const res = await request(app).get('/api/v1/ai/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.categories.length).toBe(9);
    expect(res.body.categories).toContain('Plastic');
    expect(res.body.categories).toContain('Organic/Food Waste');
    expect(res.body.confidenceThresholds).toBeDefined();
  });

  it('POST /api/v1/ai/classify should reject requests without an image (400)', async () => {
    const res = await request(app).post('/api/v1/ai/classify');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Please upload a waste image');
  });

  it('POST /api/v1/ai/classify should process valid image and return category and recommendation', async () => {
    // 1x1 pixel PNG buffer
    const fakeImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post('/api/v1/ai/classify')
      .attach('image', fakeImageBuffer, 'plastic_bottle.png');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.predictedCategory).toBeDefined();
    expect(res.body.data.confidence).toBeDefined();
    expect(res.body.data.confidenceLevel).toBeDefined();
    expect(res.body.data.recommendation).toBeDefined();
    expect(res.body.data.recommendation.binColor).toBeDefined();
    expect(res.body.data.modelStatus).toBeDefined();
  });

  it('POST /api/v1/ai/classify should award +10 eco-credits when called by authenticated citizen', async () => {
    const citizen = await User.create({
      name: 'Eco Citizen',
      email: 'citizen_ai@test.local',
      password: 'Password123',
      ecoCredits: 0,
    });
    const token = citizen.generateAuthToken();

    const fakeImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post('/api/v1/ai/classify')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', fakeImageBuffer, 'apple_peel.png');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ecoCreditsEarned).toBe(10);

    // Verify database update
    const updatedCitizen = await User.findById(citizen._id);
    expect(updatedCitizen.ecoCredits).toBe(10);

    // Verify transaction recorded in ledger
    const tx = await EcoCreditTransaction.findOne({ userId: citizen._id });
    expect(tx).not.toBeNull();
    expect(tx.creditsEarned).toBe(10);
    expect(tx.activityType).toBe('SOURCE_SEGREGATION');
  });
});
