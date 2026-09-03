const request = require('supertest');
const { app } = require('../src/server');
const { disconnectDB } = require('../src/config/db');

describe('System Health & Scaffolding Test', () => {
  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/v1/health should return 200 OK with HEALTHY status and feature flags', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.system).toBe('Smart Waste Management & Resource Recovery Platform');
    expect(res.body.features.aiClassification).toBe('Ready');
    expect(res.body.features.iotSmartBins).toBe('Active');
  });

  it('GET /api/v1 should return API Gateway welcome and docs paths', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Smart Waste Management API Gateway');
  });

  it('GET /api/v1/non-existent-route should return 404 Route Not Found', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(404);
  });
});
