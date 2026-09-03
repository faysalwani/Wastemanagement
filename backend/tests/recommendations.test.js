const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { RecyclerDirectory } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await RecyclerDirectory.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await RecyclerDirectory.deleteMany({});
});

describe('Recommendation Engine & Recycler Directory (Milestone 6)', () => {
  it('POST /api/v1/recommendations/evaluate should route Organic Waste to Composting/Exchange', async () => {
    const res = await request(app)
      .post('/api/v1/recommendations/evaluate')
      .send({
        category: 'Organic/Food Waste',
        condition: 'CLEAN_REUSABLE',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.primaryAction).toBe('COMPOST_OR_EXCHANGE');
    expect(res.body.data.binColor).toBe('GREEN');
    expect(res.body.data.options.some((o) => o.type === 'HOME_COMPOST')).toBe(true);
  });

  it('POST /api/v1/recommendations/evaluate should prioritize Reuse for clean cardboard boxes', async () => {
    const res = await request(app)
      .post('/api/v1/recommendations/evaluate')
      .send({
        category: 'Paper/Cardboard',
        condition: 'CLEAN_REUSABLE',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.primaryAction).toBe('REUSE_OR_EXCHANGE');
    expect(res.body.data.options.some((o) => o.type === 'P2P_EXCHANGE')).toBe(true);
  });

  it('POST /api/v1/recommendations/evaluate should flag hazardous warnings for E-Waste', async () => {
    const res = await request(app)
      .post('/api/v1/recommendations/evaluate')
      .send({
        category: 'E-Waste',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.binColor).toBe('YELLOW');
    expect(res.body.data.safetyWarning).toBeDefined();
  });

  it('GET /api/v1/recommendations/recyclers should return verified recyclers', async () => {
    await RecyclerDirectory.create({
      name: 'Dal Lake Bio-Compost Hub',
      contactPhone: '+91 9419334455',
      acceptedMaterials: ['Organic Waste', 'Leaves'],
      address: 'Boulevard Road',
      wardName: 'Nishat',
      location: { type: 'Point', coordinates: [74.855, 34.088] },
      isVerified: true,
    });

    const res = await request(app).get('/api/v1/recommendations/recyclers');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].name).toBe('Dal Lake Bio-Compost Hub');
  });
});
