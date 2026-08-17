import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: 'trigonlinks-backend.env' });
import { 
  generalRateLimiter, 
  authRateLimiter, 
  apiRateLimiter, 
  slowDownMiddleware,
  sanitizeInput,
  securityHeaders,
  securityLogger
} from './middleware/security';

import { logger } from './utils/logger';
import { runStartupMigrations } from './database/migrations/startup';
import { getBackupScheduler } from './services/backup-scheduler';
import { getInvoiceScheduler } from './services/invoice-scheduler';

// Global error handlers for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('[FATAL] Uncaught Exception:', error);
  logger.error('[FATAL] Stack:', error?.stack);
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[FATAL] Unhandled Rejection at:', promise);
  logger.error('[FATAL] Reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;


// Security middleware
app.use(securityHeaders);
app.use(securityLogger);
app.use(sanitizeInput);
app.use(generalRateLimiter);
app.use(slowDownMiddleware);

// Configure allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];

// Add production frontend origin
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://trigonlinks-pasrur.web.app');
  // In production, strip any localhost entries to prevent cross-origin attacks
  for (let i = allowedOrigins.length - 1; i >= 0; i--) {
    if (allowedOrigins[i].includes('localhost') || allowedOrigins[i].includes('127.0.0.1')) {
      allowedOrigins.splice(i, 1);
    }
  }
}

// CORS middleware - must come before helmet
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin for development only (Flutter Web uses dynamic ports)
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      callback(null, true);
    }
    // Check if origin is in allowed list
    else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const isDev = process.env.NODE_ENV !== 'production';
  const localhostAllowed = isDev && (origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:'));
  // Allow localhost (dev only) or origins in the allowed list
  if (!origin || localhostAllowed || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

// Security headers - helmet adds a robust set of HTTP security headers.
// crossOriginResourcePolicy is set to cross-origin so it does not conflict with CORS.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // disabled for API server; frontend handles its own CSP
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import billingRoutes from './routes/billing';
import notificationRoutes from './routes/notifications';
import customerRoutes from './routes/customers';
import customerAdvancedRoutes from './routes/customer-advanced';
import packageRoutes from './routes/packages';
import connectionRoutes from './routes/connections';
import invoiceRoutes from './routes/invoices';
import inventoryRoutes from './routes/inventory';
import staffRoutes from './routes/staff';
import expenseRoutes from './routes/expenses';
import newCustomerRoutes from './routes/newCustomers';
import areaRoutes from './routes/areas';
import complaintRoutes from './routes/complaints';
import announcementRoutes from './routes/announcements';
import reportRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';
import rolesRoutes from './routes/roles';
import logsRoutes from './routes/logs';
import googleRoutes from './routes/google';
import backupRoutes from './routes/backup';

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authRateLimiter, authRoutes);

// Apply API rate limiting to all other API routes
app.use('/api/users', apiRateLimiter, userRoutes);
app.use('/api/billing', apiRateLimiter, billingRoutes);
app.use('/api/notifications', apiRateLimiter, notificationRoutes);
app.use('/api/customers', apiRateLimiter, customerRoutes);
app.use('/api/customers/advanced', apiRateLimiter, customerAdvancedRoutes);
app.use('/api/packages', apiRateLimiter, packageRoutes);
app.use('/api/connections', apiRateLimiter, connectionRoutes);
app.use('/api/invoices', apiRateLimiter, invoiceRoutes);
app.use('/api/inventory', apiRateLimiter, inventoryRoutes);
app.use('/api/staff', apiRateLimiter, staffRoutes);
app.use('/api/expenses', apiRateLimiter, expenseRoutes);
app.use('/api/new-customers', apiRateLimiter, newCustomerRoutes);
app.use('/api/areas', apiRateLimiter, areaRoutes);
app.use('/api/complaints', apiRateLimiter, complaintRoutes);
app.use('/api/announcements', apiRateLimiter, announcementRoutes);
app.use('/api/reports', apiRateLimiter, reportRoutes);
app.use('/api/dashboard', apiRateLimiter, dashboardRoutes);
app.use('/api/roles', apiRateLimiter, rolesRoutes);
app.use('/api/logs', apiRateLimiter, logsRoutes);
app.use('/api/google', apiRateLimiter, googleRoutes);
app.use('/api/backup', apiRateLimiter, backupRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('[ERROR] Express error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown handling
let server: any;

const gracefulShutdown = (signal: string) => {
  logger.info(`[SHUTDOWN] ${signal} received, shutting down gracefully...`);
  
  if (server) {
    server.close(() => {
      logger.info('[SHUTDOWN] Server closed');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('[SHUTDOWN] Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server with error handling
const startServer = async () => {
  // Run database migrations on startup to ensure schema is up-to-date
  logger.info('[MIGRATION] Starting database migrations...');
  const migrationSuccess = await runStartupMigrations();
  
  if (!migrationSuccess) {
    logger.warn('[MIGRATION] Migration check completed with warnings. Server will start but schema may not be fully up-to-date.');
  }

  // Start automated backup scheduler in production
  // Temporarily disabled for development
  // if (process.env.NODE_ENV === 'production') {
  //   const backupInterval = parseInt(process.env.BACKUP_INTERVAL_HOURS || '24');
  //   const backupScheduler = getBackupScheduler();
  //   backupScheduler.start(backupInterval);
  //   logger.info(`[BACKUP] Automated backup scheduler started (interval: ${backupInterval} hours)`);
  // }

  // Start auto invoice scheduler — generates invoices daily for customers whose
  // billing date matches today. Runs in all environments so dev mode is testable.
  const invoiceScheduler = getInvoiceScheduler();
  invoiceScheduler.start();
  logger.info('[INVOICE-CRON] Auto invoice scheduler started');

  server = app.listen(PORT, () => {
    logger.info(`[SERVER] Server running on port ${PORT}`);
    logger.info(`[SERVER] Health check available at http://localhost:${PORT}/health`);
    logger.info(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  }).on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`[FATAL] Port ${PORT} is already in use. Please check if another instance is running.`);
    } else {
      logger.error('[FATAL] Server error:', error);
    }
    process.exit(1);
  });
};

startServer();
