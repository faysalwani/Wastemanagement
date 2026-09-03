const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User, PendingRegistration, AuditLog } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
  await PendingRegistration.init();
  await AuditLog.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await PendingRegistration.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('Revised Role-First & Passwordless Staff Authentication Matrix', () => {
  // ==============================================================
  // 1. CITIZEN SIGNUP PIPELINE (INITIATE + OTP VERIFY -> CITIZEN)
  // ==============================================================
  describe('Public Citizen Registration Pipeline', () => {
    it('Initiate should reject weak passwords (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/initiate')
        .send({
          name: 'Zahoor Bhat',
          email: 'zahoor@test.local',
          password: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Initiate should send 6-digit OTP and hold in PendingRegistration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/initiate')
        .send({
          name: 'Zahoor Bhat',
          email: 'zahoor@test.local',
          password: 'CitizenSecurePassword@123',
          phone: '+91 9419123456',
          wardName: 'Rajbagh',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.demoOtp).toMatch(/^\d{6}$/);

      // Verify record is in PendingRegistration, NOT in User yet!
      const pending = await PendingRegistration.findOne({ email: 'zahoor@test.local' });
      expect(pending).toBeDefined();

      const user = await User.findOne({ email: 'zahoor@test.local' });
      expect(user).toBeNull();
    });

    it('Verify should activate Citizen account and issue 28-day JWT token', async () => {
      const initRes = await request(app)
        .post('/api/v1/auth/register/initiate')
        .send({
          name: 'Zahoor Bhat',
          email: 'zahoor@test.local',
          password: 'CitizenSecurePassword@123',
          wardName: 'Rajbagh',
        });

      const otp = initRes.body.demoOtp;

      const verifyRes = await request(app)
        .post('/api/v1/auth/register/verify')
        .send({
          email: 'zahoor@test.local',
          otp,
        });

      expect(verifyRes.statusCode).toBe(201);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.user.role).toBe('CITIZEN');
      expect(verifyRes.body.token).toBeDefined();

      // Pending record is cleaned up
      const pending = await PendingRegistration.findOne({ email: 'zahoor@test.local' });
      expect(pending).toBeNull();

      // Active user now exists
      const user = await User.findOne({ email: 'zahoor@test.local' });
      expect(user).toBeDefined();
      expect(user.role).toBe('CITIZEN');
      expect(user.lastOtpVerifiedAt).toBeDefined();
    });
  });

  // ==============================================================
  // 2. CITIZEN LOGIN (EMAIL + PASSWORD & MONTHLY OTP)
  // ==============================================================
  describe('Citizen Login & 30-Day Periodic OTP Verification', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Bashir Wani',
        email: 'bashir@test.local',
        password: 'Password@123',
        role: 'CITIZEN',
        lastOtpVerifiedAt: new Date(), // Recently verified
      });

      // Staff user for context boundary testing
      await User.create({
        name: 'Operational Admin',
        email: 'staffadmin@test.local',
        role: 'ADMIN',
      });
    });

    it('Citizen logs in normally with Email + Password when verified within 30 days', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login-citizen')
        .send({
          email: 'bashir@test.local',
          password: 'Password@123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('CITIZEN');
    });

    it('Staff account attempting citizen password login is rejected (403)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login-citizen')
        .send({
          email: 'staffadmin@test.local',
          password: 'AnyPassword@123',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error.message).toContain("Access Denied: This account is registered as 'ADMIN'");
    });

    it('Citizen with lastOtpVerifiedAt > 30 days triggers monthly OTP re-verification', async () => {
      // Set lastOtpVerifiedAt to 35 days ago
      const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
      await User.updateOne({ email: 'bashir@test.local' }, { lastOtpVerifiedAt: thirtyFiveDaysAgo });

      const res = await request(app)
        .post('/api/v1/auth/login-citizen')
        .send({
          email: 'bashir@test.local',
          password: 'Password@123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.requireMonthlyOtp).toBe(true);
      expect(res.body.demoOtp).toMatch(/^\d{6}$/);

      // Verify the monthly OTP
      const monthlyRes = await request(app)
        .post('/api/v1/auth/verify-monthly-otp')
        .send({
          email: 'bashir@test.local',
          otp: res.body.demoOtp,
        });

      expect(monthlyRes.statusCode).toBe(200);
      expect(monthlyRes.body.success).toBe(true);
      expect(monthlyRes.body.token).toBeDefined();

      // Check updated timestamp
      const updatedUser = await User.findOne({ email: 'bashir@test.local' });
      expect(Date.now() - updatedUser.lastOtpVerifiedAt.getTime()).toBeLessThan(5000);
    });
  });

  // ==============================================================
  // 3. STAFF AUTHENTICATION (DRIVER & ADMIN OTP ONLY)
  // ==============================================================
  describe('Staff Authentication (OTP Only — No Password Fields)', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Depot Driver',
        email: 'depotdriver@test.local',
        role: 'DRIVER',
      });

      await User.create({
        name: 'Municipal Admin',
        email: 'muniadmin@test.local',
        role: 'ADMIN',
      });

      await User.create({
        name: 'Super Controller',
        email: 'supercontroller@test.local',
        role: 'SUPER_ADMIN',
      });

      await User.create({
        name: 'Common Citizen',
        email: 'commoncitizen@test.local',
        password: 'Password@123',
        role: 'CITIZEN',
      });
    });

    it('Citizen cannot request Staff OTP on Admin or Driver portals (403)', async () => {
      const adminAttempt = await request(app)
        .post('/api/v1/auth/send-staff-otp')
        .send({
          email: 'commoncitizen@test.local',
          expectedPortal: 'ADMIN',
        });

      expect(adminAttempt.statusCode).toBe(403);
      expect(adminAttempt.body.error.message).toContain('Access Denied');

      const driverAttempt = await request(app)
        .post('/api/v1/auth/send-staff-otp')
        .send({
          email: 'commoncitizen@test.local',
          expectedPortal: 'DRIVER',
        });

      expect(driverAttempt.statusCode).toBe(403);
    });

    it('Driver logs in via Driver portal with OTP only and receives 21-day JWT', async () => {
      const sendRes = await request(app)
        .post('/api/v1/auth/send-staff-otp')
        .send({
          email: 'depotdriver@test.local',
          expectedPortal: 'DRIVER',
        });

      expect(sendRes.statusCode).toBe(200);
      const otp = sendRes.body.demoOtp;

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-staff-otp')
        .send({
          email: 'depotdriver@test.local',
          otp,
          expectedPortal: 'DRIVER',
        });

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.user.role).toBe('DRIVER');
      expect(verifyRes.body.dashboardRoute).toBe('/driver');

      // Decode JWT to verify expiration time (approx 21 days)
      const decoded = jwt.decode(verifyRes.body.token);
      const lifetimeSeconds = decoded.exp - decoded.iat;
      expect(lifetimeSeconds).toBe(21 * 24 * 60 * 60);
    });

    it('Admin logs in via Admin portal and receives 14-day JWT', async () => {
      const sendRes = await request(app)
        .post('/api/v1/auth/send-staff-otp')
        .send({
          email: 'muniadmin@test.local',
          expectedPortal: 'ADMIN',
        });

      expect(sendRes.statusCode).toBe(200);
      const otp = sendRes.body.demoOtp;

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-staff-otp')
        .send({
          email: 'muniadmin@test.local',
          otp,
          expectedPortal: 'ADMIN',
        });

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.user.role).toBe('ADMIN');
      expect(verifyRes.body.dashboardRoute).toBe('/admin');

      const decoded = jwt.decode(verifyRes.body.token);
      const lifetimeSeconds = decoded.exp - decoded.iat;
      expect(lifetimeSeconds).toBe(14 * 24 * 60 * 60);
    });

    it('Super Admin logs in via Admin portal and receives 7-day JWT with /super-admin routing', async () => {
      const sendRes = await request(app)
        .post('/api/v1/auth/send-staff-otp')
        .send({
          email: 'supercontroller@test.local',
          expectedPortal: 'ADMIN',
        });

      expect(sendRes.statusCode).toBe(200);
      const otp = sendRes.body.demoOtp;

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-staff-otp')
        .send({
          email: 'supercontroller@test.local',
          otp,
          expectedPortal: 'ADMIN',
        });

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.user.role).toBe('SUPER_ADMIN');
      expect(verifyRes.body.dashboardRoute).toBe('/super-admin');

      const decoded = jwt.decode(verifyRes.body.token);
      const lifetimeSeconds = decoded.exp - decoded.iat;
      expect(lifetimeSeconds).toBe(7 * 24 * 60 * 60);
    });
  });

  // ==============================================================
  // 4. FORGOT PASSWORD (CITIZEN ONLY)
  // ==============================================================
  describe('Citizen Forgot Password & Staff Recovery Blocking', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Forgot Citizen',
        email: 'forgotcitizen@test.local',
        password: 'OldPassword@123',
        role: 'CITIZEN',
      });

      await User.create({
        name: 'Forgot Admin',
        email: 'forgotadmin@test.local',
        role: 'ADMIN',
      });
    });

    it('Staff accounts requesting password reset are blocked (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'forgotadmin@test.local' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('Password reset is not available for staff accounts');
    });

    it('Citizen can request reset OTP and update password', async () => {
      const sendRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'forgotcitizen@test.local' });

      expect(sendRes.statusCode).toBe(200);
      const otp = sendRes.body.demoOtp;

      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'forgotcitizen@test.local',
          otp,
          newPassword: 'BrandNewPassword@123',
        });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/v1/auth/login-citizen')
        .send({
          email: 'forgotcitizen@test.local',
          password: 'BrandNewPassword@123',
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });
  });

  // ==============================================================
  // 5. ACTIVE SESSION INVALIDATION ON ROLE CHANGE
  // ==============================================================
  describe('Session Invalidation on Role Change', () => {
    it('Old token is invalidated immediately when Super Admin updates role', async () => {
      const superAdmin = await User.create({
        name: 'Root Admin',
        email: 'root@test.local',
        role: 'SUPER_ADMIN',
      });
      const superToken = superAdmin.generateAuthToken();

      const citizen = await User.create({
        name: 'Promotable Citizen',
        email: 'promotable@test.local',
        password: 'Password@123',
        role: 'CITIZEN',
      });
      const citizenToken = citizen.generateAuthToken();

      // Citizen token works initially
      const initialReq = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(initialReq.statusCode).toBe(200);

      // Super Admin promotes Citizen -> Driver (increments tokenVersion)
      const promoteRes = await request(app)
        .patch(`/api/v1/super-admin/users/${citizen._id}/role`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ role: 'DRIVER', reason: 'Fleet re-assignment' });
      expect(promoteRes.statusCode).toBe(200);

      // Old Citizen token must now be rejected with 401!
      const blockedReq = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(blockedReq.statusCode).toBe(401);
      expect(blockedReq.body.error.message).toContain('Your security role or session has been updated');
    });
  });
});
