import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
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

// Standard middleware
app.use(helmet());
app.use(cors({
  origin: ['https://trigonlink.pakdata.net', 'https://trigonlinks-pasrur.web.app', 'https://trigonlink.web.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
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
  // Skip database migrations - using Supabase REST API only
  logger.info('[MIGRATION] Skipping migrations - using Supabase REST API for all database operations');

  server = app.listen(PORT, () => {
    logger.info(`[SERVER] Server running on port ${PORT}`);
    logger.info(`[SERVER] Health check available at http://localhost:${PORT}/health`);
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
