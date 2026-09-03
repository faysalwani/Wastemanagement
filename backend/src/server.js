const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { initSockets } = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for local dev
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});
initSockets(io);

// Essential Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded static assets
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// System Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'HEALTHY',
    system: 'Smart Waste Management & Resource Recovery Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      aiClassification: 'Ready',
      iotSmartBins: 'Active',
      routeOptimization: 'Active',
      gisHotspots: 'Active',
      p2pResourceExchange: 'Active',
      ecoCredits: 'Active'
    }
  });
});

// Root API Welcome
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Smart Waste Management API Gateway',
    documentation: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

// Mount Feature API Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);

// 404 Handler for undefined routes
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: `API Route Not Found: ${req.method} ${req.originalUrl}`
    }
  });
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Smart Waste Management Platform Gateway Online`);
      console.log(`📡 Server Port: http://localhost:${PORT}`);
      console.log(`🩺 Health API: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  });
}

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('[System] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[System] Process terminated.');
  });
});

module.exports = { app, server };

