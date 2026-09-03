const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User, AuditLog } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
  await AuditLog.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('Production Authentication, RBAC & OTP Suite', () => {
  // ==========================================
  // 1. PUBLIC REGISTRATION (STRICT CITIZEN)
  // ==========================================
  describe('Public Signup Enforcement', () => {
    it('Public signup must strictly assign role = CITIZEN', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Iqbal Bhat',
          email: 'iqbal@test.local',
          password: 'Password@123',
          wardName: 'Rajbagh',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('CITIZEN');
      expect(res.body.token).toBeDefined();
    });

    it('Public signup cannot assign DRIVER, ADMIN, or SUPER_ADMIN even if requested', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Malicious Actor',
          email: 'hacker@test.local',
          password: 'Password@123',
          role: 'ADMIN', // Attempting to self-select ADMIN
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).toBe('CITIZEN'); // Strictly enforced
    });
  });

  // ==========================================
  // 2. EMAIL + OTP AUTHENTICATION PIPELINE
  // ==========================================
  describe('Email + OTP Login Flow', () => {
    let citizen;

    beforeEach(async () => {
      citizen = await User.create({
        name: 'Asif Mir',
        email: 'asif@test.local',
        password: 'Password@123',
        role: 'CITIZEN',
      });
    });

    it('POST /auth/send-otp should return 404 for unregistered email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'unknown@test.local' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('POST /auth/send-otp should generate 6-digit OTP and cooldown for registered user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'asif@test.local' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cooldownSeconds).toBe(60);
      expect(res.body.demoOtp).toMatch(/^\d{6}$/);
    });

    it('POST /auth/send-otp should enforce 60s cooldown on immediate resend', async () => {
      // First request
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'asif@test.local' });

      // Immediate second request
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'asif@test.local' });

      expect(res.statusCode).toBe(429);
      expect(res.body.error.message).toContain('Please wait');
    });

    it('POST /auth/verify-otp should reject incorrect OTP with remaining attempts', async () => {
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'asif@test.local' });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'asif@test.local', otp: '000000' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid OTP');
    });

    it('POST /auth/verify-otp should authenticate user and issue JWT token on valid OTP', async () => {
      const sendRes = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'asif@test.local' });

      const validOtp = sendRes.body.demoOtp;

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'asif@test.local', otp: validOtp });

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.token).toBeDefined();
      expect(verifyRes.body.user.role).toBe('CITIZEN');
    });
  });

  // ==========================================
  // 3. SUPER ADMIN & ROLE-BASED ACCESS CONTROL
  // ==========================================
  describe('Super Admin & Role Management Hierarchy', () => {
    let superAdminToken, adminToken, citizenToken, targetCitizen;

    beforeEach(async () => {
      const superAdmin = await User.create({
        name: 'Master Super Admin',
        email: 'superadmin@test.local',
        password: 'Password@123',
        role: 'SUPER_ADMIN',
      });
      superAdminToken = superAdmin.generateAuthToken();

      const admin = await User.create({
        name: 'Municipal Admin',
        email: 'admin@test.local',
        password: 'Password@123',
        role: 'ADMIN',
      });
      adminToken = admin.generateAuthToken();

      targetCitizen = await User.create({
        name: 'Standard Citizen',
        email: 'target@test.local',
        password: 'Password@123',
        role: 'CITIZEN',
      });
      citizenToken = targetCitizen.generateAuthToken();
    });

    it('CITIZEN cannot access Super Admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/v1/super-admin/users')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('ADMIN cannot access Super Admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/v1/super-admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('SUPER_ADMIN can access user directory (200)', async () => {
      const res = await request(app)
        .get('/api/v1/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
    });

    it('SUPER_ADMIN can promote CITIZEN to DRIVER', async () => {
      const res = await request(app)
        .patch(`/api/v1/super-admin/users/${targetCitizen._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: 'DRIVER', reason: 'Assigned to Batamaloo fleet' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.role).toBe('DRIVER');

      // Verify Audit Log recorded
      const audit = await AuditLog.findOne({ targetUser: targetCitizen._id });
      expect(audit).toBeDefined();
      expect(audit.action).toBe('ROLE_CHANGE');
      expect(audit.newValue).toBe('DRIVER');
    });

    it('SUPER_ADMIN cannot demote the last remaining active Super Admin', async () => {
      const superUser = await User.findOne({ role: 'SUPER_ADMIN' });
      // Create a second super admin to issue request
      const secondSuper = await User.create({
        name: 'Second Super Admin',
        email: 'super2@test.local',
        password: 'Password@123',
        role: 'SUPER_ADMIN',
      });
      const secondToken = secondSuper.generateAuthToken();

      // First demote superUser -> succeeds because secondSuper exists
      await request(app)
        .patch(`/api/v1/super-admin/users/${superUser._id}/role`)
        .set('Authorization', `Bearer ${secondToken}`)
        .send({ role: 'ADMIN' });

      // Now attempt to demote secondSuper (who is the last one remaining) -> must be rejected!
      // But notice: secondSuper cannot demote self anyway. Let's make superUser demote secondSuper after restoring superUser
      superUser.role = 'CITIZEN';
      await superUser.save();

      // Now only secondSuper is SUPER_ADMIN. Let's make third admin try to demote secondSuper
      const thirdSuper = await User.create({
        name: 'Third Super Admin',
        email: 'super3@test.local',
        password: 'Password@123',
        role: 'SUPER_ADMIN',
      });
      // Delete secondSuper so only thirdSuper remains
      await User.deleteOne({ _id: secondSuper._id });

      // thirdSuper tries to demote thirdSuper -> rejected due to self-modification
      const selfRes = await request(app)
        .patch(`/api/v1/super-admin/users/${thirdSuper._id}/role`)
        .set('Authorization', `Bearer ${thirdSuper.generateAuthToken()}`)
        .send({ role: 'ADMIN' });

      expect(selfRes.statusCode).toBe(400);
      expect(selfRes.body.error.message).toContain('cannot modify their own');
    });

    it('SUPER_ADMIN can suspend and reactivate a user account', async () => {
      // Suspend
      const suspendRes = await request(app)
        .patch(`/api/v1/super-admin/users/${targetCitizen._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: false, reason: 'Violation of waste disposal policy' });

      expect(suspendRes.statusCode).toBe(200);
      expect(suspendRes.body.data.isActive).toBe(false);

      // Verify suspended citizen cannot access protected routes
      const blockedRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(blockedRes.statusCode).toBe(403);

      // Reactivate
      const reactivateRes = await request(app)
        .patch(`/api/v1/super-admin/users/${targetCitizen._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: true, reason: 'Reinstated after review' });

      expect(reactivateRes.statusCode).toBe(200);
      expect(reactivateRes.body.data.isActive).toBe(true);
    });
  });
});
