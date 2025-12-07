import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow all origins in development, specific origin in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import planRoutes from './routes/planRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import mappingRoutes from './routes/mappingRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import behavioralRoutes from './routes/behavioralRoutes.js';
import cbsRoutes from './routes/cbsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import juneBalanceRoutes from './routes/juneBalanceRoutes.js';
import planShareConfigRoutes from './routes/planShareConfigRoutes.js';
import productKpiMappingRoutes from './routes/productKpiMappingRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/mappings', mappingRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/behavioral', behavioralRoutes);
app.use('/api/cbs', cbsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/june-balance', juneBalanceRoutes);
app.use('/api/plan-share-config', planShareConfigRoutes);
app.use('/api/product-mappings', productKpiMappingRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SAKO PMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server after database connection
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start server only after DB connection succeeds
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 API available at http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
