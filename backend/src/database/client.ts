import { createClient } from '@supabase/supabase-js';
import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Database type selection
const DB_TYPE = process.env.DB_TYPE || 'supabase'; // 'supabase' or 'cockroachdb'

// Supabase client using the ANON key. This respects Row Level Security (RLS)
// policies and is the default client used across the application.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Supabase admin client using the SERVICE ROLE key. This BYPASSES RLS and must
// only be used for privileged operations (user management, password resets,
// migrations) that explicitly require elevated access.
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : supabase;

// CockroachDB connection pool
let cockroachPool: Pool;

// Initialize CockroachDB connection pool
const initializeCockroachPool = () => {
  if (!cockroachPool && DB_TYPE === 'cockroachdb') {
    const connectionString = process.env.COCKROACHDB_CONNECTION_STRING || 
      `postgresql://${process.env.COCKROACHDB_USER}:${process.env.COCKROACHDB_PASSWORD}@${process.env.COCKROACHDB_HOST}:${process.env.COCKROACHDB_PORT}/${process.env.COCKROACHDB_DATABASE}`;
    
    cockroachPool = new Pool({
      connectionString,
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
      idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000,
      connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT) : 2000,
      // SSL configuration for CockroachDB.
      // If DB_SSL_ROOT_CERT is set, the connection is fully verified against that CA.
      // Otherwise sslmode=require still encrypts but cannot verify the server identity.
      ...(process.env.DB_SSL_ROOT_CERT
        ? { ssl: { ca: readFileSync(process.env.DB_SSL_ROOT_CERT).toString(), rejectUnauthorized: true } }
        : { ssl: { rejectUnauthorized: false } })
    });
    
    logger.info('CockroachDB connection pool initialized');
  }
  return cockroachPool;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    if (DB_TYPE === 'cockroachdb') {
      const pool = initializeCockroachPool();
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      logger.info('CockroachDB connection successful');
      return true;
    } else {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      logger.info('Supabase connection successful');
      return true;
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Execute a query (works with both databases)
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    if (DB_TYPE === 'cockroachdb') {
      const pool = initializeCockroachPool();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug(`CockroachDB query executed in ${duration}ms: ${text.substring(0, 100)}...`);
      return result;
    } else {
      // For Supabase, we don't support direct SQL queries
      // Use Supabase client methods instead
      logger.warn('Direct SQL query called with Supabase - use Supabase client methods instead');
      throw new Error('Direct SQL queries not supported with Supabase client. Use Supabase client methods instead.');
    }
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Query failed after ${duration}ms: ${text.substring(0, 100)}...`, error);
    throw error;
  }
};

// Get a client from the pool (for CockroachDB transactions)
export const getClient = async (): Promise<PoolClient> => {
  if (DB_TYPE === 'cockroachdb') {
    const pool = initializeCockroachPool();
    return await pool.connect();
  } else {
    throw new Error('Client pool not available for Supabase. Use Supabase client methods instead.');
  }
};

// Close all connections
export const closePool = async (): Promise<void> => {
  if (cockroachPool) {
    await cockroachPool.end();
    cockroachPool = null;
    logger.info('CockroachDB connection pool closed');
  }
};

// Get Supabase client instance (anon key — RLS enforced)
export const getSupabaseClient = () => supabase;

// Get Supabase admin client instance (service role — bypasses RLS).
// Use ONLY for privileged operations such as user creation, password updates,
// and migrations. Never use this client for regular customer-facing queries.
export const getAdminClient = () => supabaseAdmin;

// Get database type
export const getDatabaseType = () => DB_TYPE;

// Migration helper function
export const runMigration = async (migrationSQL: string): Promise<void> => {
  try {
    if (DB_TYPE === 'cockroachdb') {
      const client = await getClient();
      try {
        await client.query(migrationSQL);
        logger.info('CockroachDB migration executed successfully');
      } finally {
        client.release();
      }
    } else {
      logger.warn('Migration not supported for Supabase. Use Supabase SQL Editor or dashboard.');
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

// Transaction helper (CockroachDB only)
export const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  if (DB_TYPE === 'cockroachdb') {
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
  } else {
    throw new Error('Transactions not supported for Supabase client');
  }
};

export default {
  getSupabaseClient,
  testConnection,
  query,
  getClient,
  closePool,
  runMigration,
  transaction,
  getDatabaseType
};
