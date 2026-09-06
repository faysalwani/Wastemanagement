const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const {
  User,
  Product,
  Order,
  EcoCreditTransaction,
  Notification,
  RecyclerDirectory,
  SystemSetting,
  CompostActivity,
} = require('../src/models');

let mongoServer;
let citizenToken;
let citizenUser;
let adminToken;
let adminUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // 1. Create Citizen
  citizenUser = await User.create({
    name: 'Tariq Mir',
    email: 'tariq.citizen@test.local',
    password: 'Password123!',
    role: 'CITIZEN',
    status: 'ACTIVE',
    ecoCredits: 1000,
    ward: 'Rajbagh',
  });

  const citizenLoginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'tariq.citizen@test.local',
    password: 'Password123!',
  });
  citizenToken = citizenLoginRes.body.token;

  // 2. Create Admin
  adminUser = await User.create({
    name: 'Admin Farooq',
    email: 'farooq.admin@test.local',
    password: 'Password123!',
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'farooq.admin@test.local',
    password: 'Password123!',
  });
  // Admin password login produces pending 2FA token; verify with OTP
  const verifyRes = await request(app).post('/api/v1/auth/verify-otp').send({
    email: 'farooq.admin@test.local',
    otp: adminLoginRes.body.data?.testOtp || '123456',
  });
  adminToken = verifyRes.body.token || adminLoginRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('1. Rewards Marketplace Products & Inventory', () => {
  let createdProductId;

  test('Admin can create a new product', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Aerobic Kitchen Compost Kit',
        description: 'Odourless 15L indoor composting bucket with microbial bran',
        category: 'COMPOSTING_KITS',
        moneyPrice: 799,
        ecoCreditPrice: 450,
        stock: 10,
        vendor: 'Kashmir Organic Collective',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Aerobic Kitchen Compost Kit');
    expect(res.body.data.stock).toBe(10);
    expect(res.body.data.status).toBe('ACTIVE');
    createdProductId = res.body.data._id;
  });

  test('Citizen is forbidden from creating products', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/products')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        name: 'Illegal Product',
        description: 'Should fail',
        category: 'DUSTBINS',
        moneyPrice: 100,
        ecoCreditPrice: 100,
        stock: 5,
      });

    expect(res.status).toBe(403);
  });

  test('Public can list active products with category filter and search', async () => {
    const res = await request(app)
      .get('/api/v1/marketplace/products')
      .query({ category: 'COMPOSTING_KITS', search: 'Compost' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].category).toBe('COMPOSTING_KITS');
  });

  test('Admin can update stock of a product', async () => {
    const res = await request(app)
      .patch(`/api/v1/marketplace/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stock: 15 });

    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(15);
  });
});

describe('2. Eco-Credit Order Placement & Atomic Redemption', () => {
  let testProductId;

  beforeAll(async () => {
    const prod = await Product.create({
      name: 'Segregated Dual Bin Set',
      description: 'Colour-coded blue and green 30L bins',
      category: 'SEGREGATION_BINS',
      moneyPrice: 899,
      ecoCreditPrice: 400,
      stock: 5,
      status: 'ACTIVE',
    });
    testProductId = prod._id;
  });

  test('Citizen successfully redeems product using Eco-Credits', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/orders')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        productId: testProductId,
        quantity: 1,
        paymentMethod: 'ECO_CREDITS',
        shippingAddress: {
          street: 'Boulevard Road, House 12',
          wardName: 'Rajbagh',
          contactPhone: '9419012345',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentMethod).toBe('ECO_CREDITS');
    expect(res.body.data.ecoCreditAmount).toBe(400);

    // Verify atomic deductions
    const updatedUser = await User.findById(citizenUser._id);
    expect(updatedUser.ecoCredits).toBe(600); // 1000 - 400

    const updatedProd = await Product.findById(testProductId);
    expect(updatedProd.stock).toBe(4); // 5 - 1

    // Verify transaction ledger
    const tx = await EcoCreditTransaction.findOne({
      userId: citizenUser._id,
      activityType: 'MARKETPLACE_REDEMPTION',
    });
    expect(tx).toBeTruthy();
    expect(tx.creditsEarned).toBe(-400);
    expect(tx.balanceAfter).toBe(600);
  });

  test('Citizen is rejected if Eco-Credits balance is insufficient', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/orders')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        productId: testProductId,
        quantity: 2, // 2 * 400 = 800 EC, but citizen only has 600 EC
        paymentMethod: 'ECO_CREDITS',
        shippingAddress: {
          street: 'Boulevard Road, House 12',
          wardName: 'Rajbagh',
          contactPhone: '9419012345',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Insufficient Eco-Credits/i);
  });

  test('Out of stock error when purchasing more than available', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/orders')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        productId: testProductId,
        quantity: 5, // stock is 1
        paymentMethod: 'MONEY',
        shippingAddress: {
          street: 'Boulevard Road, House 12',
          wardName: 'Rajbagh',
          contactPhone: '9419012345',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/stock/i);
  });
});

describe('3. Order Cancellation & Compensating Eco-Credit Refund', () => {
  let orderToCancelId;

  beforeAll(async () => {
    const prod = await Product.create({
      name: 'Compost Aeration Fork',
      description: 'Stainless steel spiral aerator',
      category: 'GARDENING',
      moneyPrice: 400,
      ecoCreditPrice: 300,
      stock: 5,
      status: 'ACTIVE',
    });

    const orderRes = await request(app)
      .post('/api/v1/marketplace/orders')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        productId: prod._id,
        quantity: 1,
        paymentMethod: 'ECO_CREDITS',
        shippingAddress: {
          street: 'Rajbagh Ext',
          wardName: 'Rajbagh',
          contactPhone: '9419012345',
        },
      });

    orderToCancelId = orderRes.body.data._id;
  });

  test('Citizen can cancel order and receive full Eco-Credit refund and stock restore', async () => {
    const preUser = await User.findById(citizenUser._id);
    const initialCredits = preUser.ecoCredits;

    const res = await request(app)
      .patch(`/api/v1/marketplace/orders/${orderToCancelId}/cancel`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ reason: 'Ordered wrong item by mistake' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');

    // Balance restored
    const postUser = await User.findById(citizenUser._id);
    expect(postUser.ecoCredits).toBe(initialCredits + 300);

    // Compensating transaction logged
    const refundTx = await EcoCreditTransaction.findOne({
      userId: citizenUser._id,
      activityType: 'REDEMPTION_REFUND',
    });
    expect(refundTx).toBeTruthy();
    expect(refundTx.creditsEarned).toBe(300);
  });
});

describe('4. Eco-Credit Wallet & Dynamic Rewards', () => {
  test('Citizen can fetch full wallet details with tier status', async () => {
    const res = await request(app)
      .get('/api/v1/credits/wallet')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('balance');
    expect(res.body.data).toHaveProperty('tier');
    expect(res.body.data.tier).toHaveProperty('name');
    expect(res.body.data.transactions).toHaveProperty('data');
  });

  test('Admin can fetch and update system reward configuration', async () => {
    const getRes = await request(app).get('/api/v1/credits/config');
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.compostingPoints).toBe(20);

    const updateRes = await request(app)
      .patch('/api/v1/credits/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ compostingPoints: 25 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.compostingPoints).toBe(25);
  });
});

describe('5. Recycler Recovery Directory', () => {
  let recyclerId;

  test('Admin can add verified recycling facility', async () => {
    const res = await request(app)
      .post('/api/v1/recyclers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Srinagar Green Scrap Facility',
        contactPhone: '9419088888',
        address: 'Near Old Zero Bridge, Rajbagh',
        wardName: 'Rajbagh',
        acceptedMaterials: ['Plastic', 'Paper', 'Metal'],
        operatingHours: 'Mon - Sat: 9:00 AM - 6:00 PM',
        ratesPerKg: { plastic: 15, paper: 12 },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Srinagar Green Scrap Facility');
    recyclerId = res.body.data._id;
  });

  test('Public can search recyclers by material and ward', async () => {
    const res = await request(app)
      .get('/api/v1/recyclers')
      .query({ material: 'Plastic', wardName: 'Rajbagh' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].name).toBe('Srinagar Green Scrap Facility');
  });
});

describe('6. Centralized Notification Center', () => {
  test('Citizen receives notifications and can mark them as read', async () => {
    // Create test notification
    await Notification.create({
      userId: citizenUser._id,
      type: 'SYSTEM_NOTIFICATION',
      title: 'Welcome to EcoCycle',
      message: 'Explore the rewards marketplace to redeem your eco-credits.',
    });

    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.unreadCount).toBeGreaterThanOrEqual(1);

    const notificationId = listRes.body.data[0]._id;

    const readRes = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.isRead).toBe(true);
  });
});

describe('7. Personal Waste Diversion Metrics', () => {
  test('Citizen personal diversion metrics calculated from verified activities', async () => {
    // Create a compost batch for citizen
    await CompostActivity.create({
      citizenId: citizenUser._id,
      wasteType: 'VEGETABLE_SCRAPS',
      quantityKg: 8.5,
      brownQuantityKg: 6.0,
      brownMaterialType: 'Dry Chinar Leaves',
      method: 'HOME_BIN',
    });

    const res = await request(app)
      .get('/api/v1/credits/my-diversion')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasActivity).toBe(true);
    expect(res.body.data.breakdownKg.composted).toBe(14.5); // 8.5 + 6.0
  });
});
