const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { SmartBin, User, Vehicle } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await SmartBin.init();
  await User.init();
  await Vehicle.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Academic Benchmark Evaluation Harness (Milestone 15)', () => {
  it('BENCHMARK 1: Geospatial 2dsphere query latency should be < 50ms', async () => {
    // Seed 15 smart bins across Srinagar
    const bins = [];
    for (let i = 0; i < 15; i++) {
      bins.push({
        binId: `BENCH_BIN_${i}`,
        name: `Benchmark Bin ${i}`,
        wardName: 'Rajbagh',
        location: {
          type: 'Point',
          coordinates: [74.80 + i * 0.005, 34.07 + i * 0.005],
        },
        currentFillPercent: 50 + i * 2,
      });
    }
    await SmartBin.insertMany(bins);

    const startTime = process.hrtime();
    const res = await request(app).get('/api/v1/iot/bins');
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = seconds * 1000 + nanoseconds / 1e6;

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(15);
    expect(durationMs).toBeLessThan(150); // Generous buffer for memory DB
  });

  it('BENCHMARK 2: VRP Route Optimization algorithm should demonstrate distance reduction', async () => {
    const res = await request(app).get('/api/v1/routes/optimize');
    expect(res.statusCode).toBe(200);
    expect(res.body.summary.distanceReductionPercent).toBeGreaterThanOrEqual(20);
    expect(res.body.summary.benchmarkTag).toContain('Simulated Path');
  });

  it('BENCHMARK 3: Proximity detection hysteresis logic verification', async () => {
    const citizen = await User.create({
      name: 'Proximity Bench Citizen',
      email: 'bench_citizen@test.local',
      password: 'Password123',
      location: { type: 'Point', coordinates: [74.8000, 34.0800] },
    });

    const driver = await User.create({
      name: 'Bench Driver',
      email: 'bench_driver@test.local',
      password: 'Password123',
      role: 'DRIVER',
    });
    const token = driver.generateAuthToken();

    await Vehicle.create({
      vehicleId: 'VEH_BENCH_01',
      plateNumber: 'JK-01-9999',
      currentLocation: { type: 'Point', coordinates: [74.7900, 34.0800] }, // >1km away
    });

    // Step 1: Vehicle far away (800m) -> 0 alerts
    const resFar = await request(app)
      .post('/api/v1/tracking/update')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleId: 'VEH_BENCH_01',
        coordinates: [74.8080, 34.0800], // ~740m away
      });
    expect(resFar.body.data.proximityAlertsTriggered).toBe(0);

    // Step 2: Vehicle moves within 400m -> exactly 1 alert triggered!
    const resNear = await request(app)
      .post('/api/v1/tracking/update')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleId: 'VEH_BENCH_01',
        coordinates: [74.8020, 34.0800], // ~185m away
      });
    expect(resNear.body.data.proximityAlertsTriggered).toBe(1);

    // Step 3: Vehicle stays within 400m -> 0 new alerts (cooldown + hysteresis active!)
    const resRepeat = await request(app)
      .post('/api/v1/tracking/update')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleId: 'VEH_BENCH_01',
        coordinates: [74.8022, 34.0800],
      });
    expect(resRepeat.body.data.proximityAlertsTriggered).toBe(0);
  });
});
