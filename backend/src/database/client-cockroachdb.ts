import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// CockroachDB connection pool
let pool: Pool;

// Initialize CockroachDB connection pool
const initializePool = () => {
  if (!pool) {
    const connectionString = process.env.COCKROACHDB_CONNECTION_STRING || 
      `postgresql://${process.env.COCKROACHDB_USER}:${process.env.COCKROACHDB_PASSWORD}@${process.env.COCKROACHDB_HOST}:${process.env.COCKROACHDB_PORT}/${process.env.COCKROACHDB_DATABASE}`;
    
    pool = new Pool({
      connectionString,
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
      idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000,
      connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT) : 2000,
    });
    
    logger.info('CockroachDB connection pool initialized');
  }
  return pool;
};

// Get connection pool instance
export const getPool = () => {
  if (!pool) {
    initializePool();
  }
  return pool;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    
    // Test query
    const result = await client.query('SELECT NOW()');
    client.release();
    
    logger.info('CockroachDB connection successful');
    return true;
  } catch (error) {
    logger.error('CockroachDB connection failed:', error);
    return false;
  }
};

// Execute a query (CockroachDB)
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const pool = getPool();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Query failed after ${duration}ms: ${text.substring(0, 100)}...`, error);
    throw error;
  }
};

// Get a client from the pool (for transactions)
export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  return await pool.connect();
};

// Close all connections
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('CockroachDB connection pool closed');
  }
};

// Migration helper function
export const runMigration = async (migrationSQL: string): Promise<void> => {
  try {
    const client = await getClient();
    try {
      await client.query(migrationSQL);
      logger.info('Migration executed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

// Transaction helper
export const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  getPool,
  testConnection,
  query,
  getClient,
  closePool,
  runMigration,
  transaction
};