import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';
import authRoutes from '../../backend/src/routes/authRoutes.js';
import userRoutes from '../../backend/src/routes/userRoutes.js';
import planRoutes from '../../backend/src/routes/planRoutes.js';
import taskRoutes from '../../backend/src/routes/taskRoutes.js';
import mappingRoutes from '../../backend/src/routes/mappingRoutes.js';
import performanceRoutes from '../../backend/src/routes/performanceRoutes.js';
import behavioralRoutes from '../../backend/src/routes/behavioralRoutes.js';
import cbsRoutes from '../../backend/src/routes/cbsRoutes.js';
import dashboardRoutes from '../../backend/src/routes/dashboardRoutes.js';
import { errorHandler } from '../../backend/src/middleware/errorHandler.js';

dotenv.config({ path: '.env.test' });

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

describe('SAKO PMS API Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
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
      const User = (await import('../../backend/src/models/User.js')).default;
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
        password: 'test123',
        role: 'Staff / MSO',
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
      const User = (await import('../../backend/src/models/User.js')).default;
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
      const User = (await import('../../backend/src/models/User.js')).default;
      await User.create({
        employeeId: 'ME001',
        name: 'Me User',
        email: 'me@test.com',
        password: 'me123',
        role: 'Staff / MSO',
      });

      // Login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@test.com',
          password: 'me123',
        });

      const token = loginRes.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email', 'me@test.com');
    });
  });

  describe('User Endpoints', () => {
    beforeEach(async () => {
      // Create admin user directly
      const User = (await import('../../backend/src/models/User.js')).default;
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
      const createRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: 'USER001',
          name: 'Test User',
          email: 'user@test.com',
          password: 'user123',
          role: 'Staff / MSO',
        });

      const userId = createRes.body.data?._id;

      if (userId) {
        const response = await request(app)
          .get(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('email', 'user@test.com');
      }
    });
  });

  describe('Task Endpoints', () => {
    beforeEach(async () => {
      const User = (await import('../../backend/src/models/User.js')).default;
      const user = await User.create({
        employeeId: 'STAFF001',
        name: 'Staff User',
        email: 'staff@test.com',
        password: 'staff123',
        role: 'Staff / MSO',
      });
      userId = user._id;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'staff@test.com',
          password: 'staff123',
        });
      authToken = loginRes.body.token;
    });

    test('POST /api/tasks should create a new task', async () => {
      const taskData = {
        taskType: 'Deposit Collection',
        accountId: 'ACC001',
        amount: 5000,
        description: 'Test task',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect([200, 201]).toContain(response.status);
      expect(response.body.data).toHaveProperty('taskType', 'Deposit Collection');
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
      const User = (await import('../../backend/src/models/User.js')).default;
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
      const User = (await import('../../backend/src/models/User.js')).default;
      await User.create({
        employeeId: 'STAFF001',
        name: 'Staff',
        email: 'staff@test.com',
        password: 'staff123',
        role: 'Staff / MSO',
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'staff@test.com',
          password: 'staff123',
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

