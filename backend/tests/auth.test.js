const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User } = require('../src/models');
const { protect, authorize } = require('../src/middleware/authMiddleware');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication & RBAC Middleware (Milestone 3)', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new citizen and return a valid JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Zahoor Mir',
          email: 'zahoor@srinagar.local',
          password: 'Password@123',
          wardName: 'Rajbagh',
          coordinates: [74.821, 34.067],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('zahoor@srinagar.local');
      expect(res.body.user.role).toBe('CITIZEN');
      expect(res.body.user.ecoCredits).toBe(0);
      expect(res.body.user.tier).toBe('BRONZE');
    });

    it('should prevent role tampering (never allow self-registering as ADMIN)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Attacker',
          email: 'attacker@evil.local',
          password: 'Password@123',
          role: 'ADMIN', // Malicious attempt to self-elevate
        });

      expect(res.statusCode).toBe(201);
      // Must strictly be coerced to CITIZEN
      expect(res.body.user.role).toBe('CITIZEN');
    });

    it('should return 409 Conflict if email is already registered', async () => {
      await User.create({
        name: 'Existing Citizen',
        email: 'duplicate@test.local',
        password: 'Password123',
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@test.local',
          password: 'AnotherPassword',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('should return 400 Bad Request if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'incomplete@test.local',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login User',
        email: 'login@test.local',
        password: 'CorrectPassword123',
        role: 'CITIZEN',
      });
    });

    it('should login with valid credentials and return JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.local',
          password: 'CorrectPassword123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@test.local');
    });

    it('should reject login with incorrect password (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.local',
          password: 'WrongPassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'ghost@test.local',
          password: 'CorrectPassword123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Routes & RBAC Authorization Barriers', () => {
    let citizenToken;
    let adminToken;

    beforeEach(async () => {
      const citizen = await User.create({
        name: 'Ordinary Citizen',
        email: 'citizen@barrier.local',
        password: 'Password123',
        role: 'CITIZEN',
      });
      citizenToken = citizen.generateAuthToken();

      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@barrier.local',
        password: 'Password123',
        role: 'ADMIN',
      });
      adminToken = admin.generateAuthToken();
    });

    it('GET /api/v1/auth/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('citizen@barrier.local');
    });

    it('GET /api/v1/auth/me should reject request without token (401)', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Authentication required');
    });

    it('GET /api/v1/auth/admin-check should allow ADMIN user (200)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin access granted.');
    });

    it('GET /api/v1/auth/admin-check should reject CITIZEN user with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-check')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Forbidden');
    });
  });
});
