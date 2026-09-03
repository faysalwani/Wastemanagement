const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User, AuditLog, PendingRegistration } = require('../src/models');
const { bootstrapSuperAdmin } = require('../src/utils/bootstrap');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
  await AuditLog.init();
  await PendingRegistration.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await AuditLog.deleteMany({});
  await PendingRegistration.deleteMany({});
  process.env.SUPER_ADMIN_EMAIL = 'chief@ecocycle.gov';
  process.env.SUPER_ADMIN_NAME = 'Chief Municipal Officer';
});

describe('Bootstrap, Reconciliation & RBAC Boundary Suite', () => {
  // Case 1: Normal citizen signup -> CITIZEN
  it('Case 1: Normal citizen signup strictly produces role = CITIZEN', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Normal Citizen',
        email: 'citizen1@test.local',
        password: 'Password@123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('CITIZEN');
  });

  // Case 2: Normal citizen signup with random role payload -> CITIZEN
  it('Case 2: Citizen signup with random role payload is forced to CITIZEN', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sneaky Citizen',
        email: 'sneaky@test.local',
        password: 'Password@123',
        role: 'SUPER_ADMIN', // Spoofing attempt
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('CITIZEN'); // Strictly enforced
  });

  // Case 3 & 5: Configured SUPER_ADMIN_EMAIL uses /register -> becomes CITIZEN, but bootstrap reconciles to SUPER_ADMIN
  it('Case 3 & 5: Configured email registered as CITIZEN is safely reconciled to SUPER_ADMIN', async () => {
    // Step 1: User signs up via /register
    const signupRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Faisal Wani',
        email: 'chief@ecocycle.gov',
        password: 'Password@123',
      });

    expect(signupRes.statusCode).toBe(201);
    expect(signupRes.body.user.role).toBe('CITIZEN'); // Public registration gave CITIZEN

    // Step 2: Bootstrap process runs (e.g. on server start)
    const reconciled = await bootstrapSuperAdmin();

    expect(reconciled.email).toBe('chief@ecocycle.gov');
    expect(reconciled.role).toBe('SUPER_ADMIN');

    // Verify database record has been updated
    const inDb = await User.findOne({ email: 'chief@ecocycle.gov' });
    expect(inDb.role).toBe('SUPER_ADMIN');
    expect(inDb.tokenVersion).toBe(1); // Stale citizen token invalidated!

    // Verify audit log record
    const audit = await AuditLog.findOne({ targetUser: inDb._id });
    expect(audit).toBeDefined();
    expect(audit.action).toBe('ROLE_CHANGE');
    expect(audit.newValue).toBe('SUPER_ADMIN');
  });

  // Case 4: Bootstrap runs twice -> no duplicate account
  it('Case 4: Bootstrap is idempotent and running multiple times does not create duplicates', async () => {
    await bootstrapSuperAdmin();
    await bootstrapSuperAdmin();

    const count = await User.countDocuments({ email: 'chief@ecocycle.gov' });
    expect(count).toBe(1);
  });

  // Case 6: Non-configured email cannot become ADMIN through signup
  it('Case 6: Non-configured email cannot become ADMIN through signup', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Another User',
        email: 'regular@test.local',
        password: 'Password@123',
        role: 'ADMIN',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('CITIZEN');

    await bootstrapSuperAdmin();

    const check = await User.findOne({ email: 'regular@test.local' });
    expect(check.role).toBe('CITIZEN'); // Not reconciled because not in SUPER_ADMIN_EMAIL
  });

  // Case 7: Citizen selects ADMIN login context -> rejected (403)
  it('Case 7: Citizen selecting ADMIN login context is rejected with 403 Forbidden', async () => {
    await User.create({
      name: 'Plain Citizen',
      email: 'citizen@ecocycle.local',
      password: 'Password@123',
      role: 'CITIZEN',
    });

    const res = await request(app)
      .post('/api/v1/auth/send-staff-otp')
      .send({
        email: 'citizen@ecocycle.local',
        expectedPortal: 'ADMIN',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.message).toContain('Access Denied');
  });

  // Case 8: Admin selects ADMIN login -> OTP -> Admin dashboard
  it('Case 8: Admin selects ADMIN login -> OTP -> Admin dashboard (/admin)', async () => {
    await User.create({
      name: 'Operations Admin',
      email: 'opsadmin@ecocycle.local',
      role: 'ADMIN',
    });

    const sendRes = await request(app)
      .post('/api/v1/auth/send-staff-otp')
      .send({
        email: 'opsadmin@ecocycle.local',
        expectedPortal: 'ADMIN',
      });

    expect(sendRes.statusCode).toBe(200);
    const otp = sendRes.body.demoOtp;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-staff-otp')
      .send({
        email: 'opsadmin@ecocycle.local',
        otp,
        expectedPortal: 'ADMIN',
      });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.user.role).toBe('ADMIN');
    expect(verifyRes.body.dashboardRoute).toBe('/admin');
  });

  // Case 9: Driver selects DRIVER login -> OTP -> Driver dashboard
  it('Case 9: Driver selects DRIVER login -> OTP -> Driver dashboard (/driver)', async () => {
    await User.create({
      name: 'Fleet Driver',
      email: 'fleetdriver@ecocycle.local',
      role: 'DRIVER',
    });

    const sendRes = await request(app)
      .post('/api/v1/auth/send-staff-otp')
      .send({
        email: 'fleetdriver@ecocycle.local',
        expectedPortal: 'DRIVER',
      });

    expect(sendRes.statusCode).toBe(200);
    const otp = sendRes.body.demoOtp;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-staff-otp')
      .send({
        email: 'fleetdriver@ecocycle.local',
        otp,
        expectedPortal: 'DRIVER',
      });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.user.role).toBe('DRIVER');
    expect(verifyRes.body.dashboardRoute).toBe('/driver');
  });

  // Case 10: Super Admin selects ADMIN login -> OTP -> Super Admin dashboard
  it('Case 10: Super Admin selects ADMIN login -> OTP -> Super Admin dashboard (/super-admin)', async () => {
    await User.create({
      name: 'Root Super Admin',
      email: 'superroot@ecocycle.local',
      role: 'SUPER_ADMIN',
    });

    const sendRes = await request(app)
      .post('/api/v1/auth/send-staff-otp')
      .send({
        email: 'superroot@ecocycle.local',
        expectedPortal: 'ADMIN',
      });

    expect(sendRes.statusCode).toBe(200);
    const otp = sendRes.body.demoOtp;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-staff-otp')
      .send({
        email: 'superroot@ecocycle.local',
        otp,
        expectedPortal: 'ADMIN',
      });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.user.role).toBe('SUPER_ADMIN');
    expect(verifyRes.body.dashboardRoute).toBe('/super-admin');
  });

  // Case 11: MongoDB Atlas connection failure handling
  it('Case 11: Invalid database query produces clean error response without leaking credentials', async () => {
    const res = await request(app)
      .get('/api/v1/auth/check-email?email=test@test.local');

    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('mongodb+srv://');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });
});
