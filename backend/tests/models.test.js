const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  User,
  SmartBin,
  SensorReading,
  CollectionRequest,
  Vehicle,
  ResourceListing,
  EcoCreditTransaction,
} = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  // Ensure 2dsphere indexes are built
  await User.init();
  await SmartBin.init();
  await ResourceListing.init();
  await EcoCreditTransaction.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await SmartBin.deleteMany({});
  await ResourceListing.deleteMany({});
  await EcoCreditTransaction.deleteMany({});
});

describe('Mongoose Models & Schema Invariants (Milestone 2)', () => {
  describe('User Model', () => {
    it('should hash password on save and verify with matchPassword', async () => {
      const user = await User.create({
        name: 'Test Citizen',
        email: 'citizen@test.local',
        password: 'PlainPassword123',
        role: 'CITIZEN',
      });

      expect(user.password).not.toBe('PlainPassword123');
      const isMatch = await user.matchPassword('PlainPassword123');
      expect(isMatch).toBe(true);

      const isWrongMatch = await user.matchPassword('WrongPassword');
      expect(isWrongMatch).toBe(false);
    });

    it('should generate a valid JWT token with user claims', async () => {
      const user = await User.create({
        name: 'Test Admin',
        email: 'admin@test.local',
        password: 'AdminPassword123',
        role: 'ADMIN',
        wardName: 'Lal Chowk',
      });

      const token = user.generateAuthToken();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should update reward tier properly based on eco-credits', async () => {
      const user = new User({
        name: 'Reward Hunter',
        email: 'reward@test.local',
        password: 'Password123',
        ecoCredits: 0,
      });

      user.updateTier();
      expect(user.tier).toBe('BRONZE');

      user.ecoCredits = 120;
      user.updateTier();
      expect(user.tier).toBe('SILVER');

      user.ecoCredits = 280;
      user.updateTier();
      expect(user.tier).toBe('GOLD');

      user.ecoCredits = 550;
      user.updateTier();
      expect(user.tier).toBe('ECO_CHAMPION');
    });
  });

  describe('SmartBin Model & Telematics Math', () => {
    it('should accurately compute fill percentage from ultrasonic distance', async () => {
      const bin = new SmartBin({
        binId: 'BIN_TEST_01',
        name: 'Test Bin',
        wardName: 'Rajbagh',
        depthCm: 100,
        location: { type: 'Point', coordinates: [74.82, 34.06] },
      });

      // Distance 20cm in a 100cm depth bin => (100 - 20)/100 = 80%
      expect(bin.calculateFillFromDistance(20)).toBe(80);

      // Distance 100cm => 0% fill (completely empty)
      expect(bin.calculateFillFromDistance(100)).toBe(0);

      // Distance 0cm => 100% fill (completely full)
      expect(bin.calculateFillFromDistance(0)).toBe(100);
    });

    it('should update status transitions based on fill thresholds', async () => {
      const bin = new SmartBin({
        binId: 'BIN_TEST_02',
        name: 'Threshold Bin',
        wardName: 'Hazratbal',
        depthCm: 100,
        fillThresholds: { warning: 50, urgent: 80 },
        location: { type: 'Point', coordinates: [74.84, 34.12] },
      });

      bin.currentFillPercent = 35;
      bin.updateOperationalStatus();
      expect(bin.status).toBe('NORMAL');

      bin.currentFillPercent = 65;
      bin.updateOperationalStatus();
      expect(bin.status).toBe('WARNING');

      bin.currentFillPercent = 85;
      bin.updateOperationalStatus();
      expect(bin.status).toBe('URGENT');
    });

    it('should generate and verify crypto device tokens', async () => {
      const bin = new SmartBin({
        binId: 'BIN_TEST_03',
        name: 'Crypto Bin',
        wardName: 'Bemina',
        location: { type: 'Point', coordinates: [74.77, 34.07] },
      });

      const rawToken = bin.generateDeviceToken();
      expect(typeof rawToken).toBe('string');
      expect(rawToken.length).toBe(48); // 24 bytes hex

      const calculatedHash = SmartBin.verifyDeviceToken(rawToken);
      expect(calculatedHash).toBe(bin.deviceTokenHash);
    });
  });

  describe('EcoCreditTransaction Model (Audit & Concurrency Guard)', () => {
    it('should enforce idempotency and reject duplicate credit transactions', async () => {
      const user = await User.create({
        name: 'Eco Citizen',
        email: 'ecouser@test.local',
        password: 'Password123',
      });

      const idempotencyKey = `RECYCLE_DROP_item123_${user._id}`;

      // First credit insertion must succeed
      await EcoCreditTransaction.create({
        userId: user._id,
        activityType: 'SOURCE_SEGREGATION',
        creditsEarned: 10,
        idempotencyKey,
        balanceAfter: 10,
      });

      // Second identical insertion must throw a duplicate key error (code 11000)
      await expect(
        EcoCreditTransaction.create({
          userId: user._id,
          activityType: 'SOURCE_SEGREGATION',
          creditsEarned: 10,
          idempotencyKey,
          balanceAfter: 20,
        })
      ).rejects.toThrow();
    });
  });

  describe('ResourceListing (P2P Circular Exchange Concurrency)', () => {
    it('should allow atomic reservation using conditional update', async () => {
      const owner = await User.create({
        name: 'Owner',
        email: 'owner@test.local',
        password: 'Password123',
      });

      const claimant = await User.create({
        name: 'Claimant',
        email: 'claimant@test.local',
        password: 'Password123',
      });

      const listing = await ResourceListing.create({
        ownerId: owner._id,
        title: 'Vegetable Peels',
        category: 'ORGANIC_COMPOSTABLE',
        quantity: 3,
        wardName: 'Rajbagh',
        location: { type: 'Point', coordinates: [74.82, 34.06] },
        status: 'AVAILABLE',
      });

      // Atomic claim: only succeed if status is still AVAILABLE
      const claimed = await ResourceListing.findOneAndUpdate(
        { _id: listing._id, status: 'AVAILABLE' },
        { status: 'RESERVED', claimedById: claimant._id, claimedAt: new Date(), $inc: { version: 1 } },
        { new: true }
      );

      expect(claimed).not.toBeNull();
      expect(claimed.status).toBe('RESERVED');
      expect(claimed.claimedById.toString()).toBe(claimant._id.toString());
      expect(claimed.version).toBe(2);

      // Concurrent attempt on already reserved listing must return null
      const secondClaim = await ResourceListing.findOneAndUpdate(
        { _id: listing._id, status: 'AVAILABLE' },
        { status: 'RESERVED', claimedById: owner._id },
        { new: true }
      );

      expect(secondClaim).toBeNull();
    });
  });
});
