import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';
import authRoutes from '../src/routes/authRoutes.js';
import userRoutes from '../src/routes/userRoutes.js';
import planRoutes from '../src/routes/planRoutes.js';
import taskRoutes from '../src/routes/taskRoutes.js';
import mappingRoutes from '../src/routes/mappingRoutes.js';
import performanceRoutes from '../src/routes/performanceRoutes.js';
import behavioralRoutes from '../src/routes/behavioralRoutes.js';
import cbsRoutes from '../src/routes/cbsRoutes.js';
import dashboardRoutes from '../src/routes/dashboardRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

dotenv.config();

// Set JWT_SECRET for tests if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_secret_key_for_jwt_tokens';
  process.env.JWT_EXPIRE = '30d';
}

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/mappings', mappingRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/behavioral', behavioralRoutes);
app.use('/api/cbs', cbsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use(errorHandler);

let authToken;
let adminToken;
let userId;
let branchId;
let regionId;
let areaId;

// Helper to create test hierarchy
const createTestHierarchy = async () => {
  const Region = (await import('../src/models/Region.js')).default;
  const Area = (await import('../src/models/Area.js')).default;
  const Branch = (await import('../src/models/Branch.js')).default;

  const region = await Region.create({
    name: 'Test Region',
    code: 'TEST_REGION',
  });
  regionId = region._id;

  const area = await Area.create({
    name: 'Test Area',
    code: 'TEST_AREA',
    regionId: region._id,
  });
  areaId = area._id;

  const branch = await Branch.create({
    name: 'Test Branch',
    code: 'TEST_BRANCH',
    regionId: region._id,
    areaId: area._id,
  });
  branchId = branch._id;

  return { regionId, areaId, branchId };
};

describe('SAKO PMS API Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    await createTestHierarchy();
  });

  describe('Health Check', () => {
    test('GET /api/health should return 200', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register should require authentication', async () => {
      const userData = {
        employeeId: 'TEST001',
        name: 'Test User',
        email: 'test@test.com',
        password: 'test123',
        role: 'Staff / MSO',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should require auth
      expect([401, 403]).toContain(response.status);
    });

    test('POST /api/auth/register should create user when authenticated as admin', async () => {
      // First create admin user directly in DB for testing
      const User = (await import('../src/models/User.js')).default;
      const admin = await User.create({
        employeeId: 'ADMIN001',
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'SAKO HQ / Admin',
      });

      // Login as admin
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        });

      adminToken = loginRes.body.token;

      // Now register new user
      const userData = {
        employeeId: 'TEST001',
        name: 'Test User',
        email: 'test@test.com',
        password: 'test123456',
        role: 'Staff / MSO',
        branchId: branchId.toString(),
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect([200, 201]).toContain(response.status);
      expect(response.body.data).toHaveProperty('email', 'test@test.com');
    });

    test('POST /api/auth/login should authenticate user', async () => {
      // Create user directly in DB for testing
      const User = (await import('../src/models/User.js')).default;
      await User.create({
        employeeId: 'ADMIN001',
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'SAKO HQ / Admin',
      });

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('success', true);
      adminToken = response.body.token;
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: 'wrongpass',
        });

      expect(response.status).toBe(401);
    });

    test('GET /api/auth/me should return current user', async () => {
      // Create user directly
      const User = (await import('../src/models/User.js')).default;
      await User.create({
        employeeId: 'ME001',
        name: 'Me User',
        email: 'me@test.com',
        password: 'me123456',
        role: 'Staff / MSO',
        branchId: branchId,
      });

      // Login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@test.com',
          password: 'me123456',
        });

      if (loginRes.status !== 200 || !loginRes.body.token) {
        console.log('Login failed:', loginRes.status, loginRes.body);
      }

      const token = loginRes.body.token;
      if (!token) {
        throw new Error('No token received from login');
      }

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      if (response.status !== 200) {
        console.log('Get me failed:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      if (response.body.data) {
        expect(response.body.data).toHaveProperty('email', 'me@test.com');
      } else {
        // Sometimes data is at root level
        expect(response.body).toHaveProperty('email', 'me@test.com');
      }
    });
  });

  describe('User Endpoints', () => {
    beforeEach(async () => {
      // Create admin user directly
      const User = (await import('../src/models/User.js')).default;
      await User.create({
        employeeId: 'ADMIN001',
        name: 'Admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'SAKO HQ / Admin',
      });

      // Login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        });
      adminToken = loginRes.body.token;
    });

    test('GET /api/users should return list of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/users/:id should return user by ID', async () => {
      // Create a user first
      const User = (await import('../src/models/User.js')).default;
      const user = await User.create({
        employeeId: 'USER001',
        name: 'Test User',
        email: 'user@test.com',
        password: 'user123456',
        role: 'Staff / MSO',
        branchId: branchId,
      });

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email', 'user@test.com');
    });
  });

  describe('Task Endpoints', () => {
    beforeEach(async () => {
      const User = (await import('../src/models/User.js')).default;
      const user = await User.create({
        employeeId: 'STAFF001',
        name: 'Staff User',
        email: 'staff@test.com',
        password: 'staff123456',
        role: 'Staff / MSO',
        branchId: branchId,
      });
      userId = user._id;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'staff@test.com',
          password: 'staff123456',
        });
      authToken = loginRes.body.token;
    });

    test('POST /api/tasks should create a new task', async () => {
      const taskData = {
        taskType: 'Deposit Mobilization',
        productType: 'Deposit',
        accountNumber: 'ACC001',
        amount: 5000,
        remarks: 'Test task',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      if (response.status !== 200 && response.status !== 201) {
        console.log('Task creation failed:', response.status, response.body);
      }
      expect([200, 201]).toContain(response.status);
      if (response.body.data) {
        expect(response.body.data).toHaveProperty('taskType', 'Deposit Mobilization');
      }
    });

    test('GET /api/tasks should return list of tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Dashboard Endpoints', () => {
    beforeEach(async () => {
      const User = (await import('../src/models/User.js')).default;
      await User.create({
        employeeId: 'ADMIN001',
        name: 'Admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'SAKO HQ / Admin',
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        });
      adminToken = loginRes.body.token;
    });

    test('GET /api/dashboard/hq should return HQ dashboard data', async () => {
      const response = await request(app)
        .get('/api/dashboard/hq')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    test('GET /api/dashboard/staff should return staff dashboard data', async () => {
      const User = (await import('../src/models/User.js')).default;
      await User.create({
        employeeId: 'STAFF001',
        name: 'Staff',
        email: 'staff@test.com',
        password: 'staff123456',
        role: 'Staff / MSO',
        branchId: branchId,
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'staff@test.com',
          password: 'staff123456',
        });
      const staffToken = loginRes.body.token;

      const response = await request(app)
        .get('/api/dashboard/staff')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });
});

