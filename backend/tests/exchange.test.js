const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const { User, ResourceListing, EcoCreditTransaction, Notification } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
  await ResourceListing.init();
  await EcoCreditTransaction.init();
  await Notification.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await ResourceListing.deleteMany({});
  await EcoCreditTransaction.deleteMany({});
  await Notification.deleteMany({});
});

describe('P2P Resource Exchange & Concurrency Protection (Milestone 7)', () => {
  let ownerUser;
  let ownerToken;
  let claimantUser;
  let claimantToken;

  beforeEach(async () => {
    ownerUser = await User.create({
      name: 'Owner Citizen',
      email: 'owner_exchange@test.local',
      password: 'Password123',
      wardName: 'Rajbagh',
      ecoCredits: 0,
    });
    ownerToken = ownerUser.generateAuthToken();

    claimantUser = await User.create({
      name: 'Claimant Citizen',
      email: 'claimant_exchange@test.local',
      password: 'Password123',
      wardName: 'Lal Chowk',
      ecoCredits: 0,
    });
    claimantToken = claimantUser.generateAuthToken();
  });

  it('POST /api/v1/exchange/listings should create a new listing', async () => {
    const res = await request(app)
      .post('/api/v1/exchange/listings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Fresh Vegetable Scraps for Compost',
        category: 'ORGANIC_COMPOSTABLE',
        quantity: 4.5,
        quantityUnit: 'KG',
        wardName: 'Rajbagh',
        address: 'Near Bund',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('AVAILABLE');
    expect(res.body.data.quantity).toBe(4.5);
  });

  it('GET /api/v1/exchange/listings should return active listings with category filter', async () => {
    await ResourceListing.create({
      ownerId: ownerUser._id,
      title: 'Carton Boxes',
      category: 'SCRAP_PAPER_CARDBOARD',
      quantity: 10,
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.82, 34.06] },
      status: 'AVAILABLE',
    });

    const res = await request(app)
      .get('/api/v1/exchange/listings')
      .query({ category: 'SCRAP_PAPER_CARDBOARD' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('Carton Boxes');
  });

  it('POST /api/v1/exchange/listings/:id/claim should atomically reserve listing and notify owner', async () => {
    const listing = await ResourceListing.create({
      ownerId: ownerUser._id,
      title: 'Glass Bottles',
      category: 'REUSABLE_CONTAINER',
      quantity: 8,
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.82, 34.06] },
      status: 'AVAILABLE',
    });

    const res = await request(app)
      .post(`/api/v1/exchange/listings/${listing._id}/claim`)
      .set('Authorization', `Bearer ${claimantToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESERVED');
    expect(res.body.data.claimedById).toBe(claimantUser._id.toString());

    // Verify in-app notification created for owner
    const notification = await Notification.findOne({ userId: ownerUser._id });
    expect(notification).not.toBeNull();
    expect(notification.title).toBe('Resource Claimed!');
  });

  it('POST /api/v1/exchange/listings/:id/claim should prevent owner from claiming their own listing', async () => {
    const listing = await ResourceListing.create({
      ownerId: ownerUser._id,
      title: 'Own Scraps',
      category: 'ORGANIC_COMPOSTABLE',
      quantity: 2,
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.82, 34.06] },
      status: 'AVAILABLE',
    });

    const res = await request(app)
      .post(`/api/v1/exchange/listings/${listing._id}/claim`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('cannot claim your own resource');
  });

  it('POST /api/v1/exchange/listings/:id/claim should reject simultaneous duplicate claims with 409 Conflict', async () => {
    const listing = await ResourceListing.create({
      ownerId: ownerUser._id,
      title: 'Rare Seedlings',
      category: 'ORGANIC_COMPOSTABLE',
      quantity: 5,
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.82, 34.06] },
      status: 'AVAILABLE',
    });

    // First claim succeeds
    const firstRes = await request(app)
      .post(`/api/v1/exchange/listings/${listing._id}/claim`)
      .set('Authorization', `Bearer ${claimantToken}`);
    expect(firstRes.statusCode).toBe(200);

    // Second claim from a different user attempts concurrent claim on now-reserved listing
    const thirdUser = await User.create({
      name: 'Third Citizen',
      email: 'third@test.local',
      password: 'Password123',
    });
    const thirdToken = thirdUser.generateAuthToken();

    const secondRes = await request(app)
      .post(`/api/v1/exchange/listings/${listing._id}/claim`)
      .set('Authorization', `Bearer ${thirdToken}`);

    expect(secondRes.statusCode).toBe(409);
    expect(secondRes.body.success).toBe(false);
    expect(secondRes.body.error.message).toContain('already been claimed');
  });

  it('POST /api/v1/exchange/listings/:id/complete should mark transaction COMPLETED and award +25 credits to owner', async () => {
    const listing = await ResourceListing.create({
      ownerId: ownerUser._id,
      title: 'Compost Material',
      category: 'ORGANIC_COMPOSTABLE',
      quantity: 10,
      wardName: 'Rajbagh',
      location: { type: 'Point', coordinates: [74.82, 34.06] },
      status: 'RESERVED',
      claimedById: claimantUser._id,
    });

    const res = await request(app)
      .post(`/api/v1/exchange/listings/${listing._id}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.ecoCreditsAwarded).toBe(25);

    // Verify owner's eco-credits increased
    const updatedOwner = await User.findById(ownerUser._id);
    expect(updatedOwner.ecoCredits).toBe(25);

    // Verify immutable transaction log
    const tx = await EcoCreditTransaction.findOne({
      userId: ownerUser._id,
      activityType: 'RESOURCE_EXCHANGE',
    });
    expect(tx).not.toBeNull();
    expect(tx.creditsEarned).toBe(25);
  });
});
