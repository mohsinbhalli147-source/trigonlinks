import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Execute a query (Supabase client - for simple CRUD operations)
// Note: For complex SQL queries, use Supabase SQL Editor or RPC functions
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    // This is a simplified query function for backward compatibility
    // For actual SQL execution, we need to use Supabase's REST API or RPC functions
    // For now, this will be replaced with specific Supabase client calls in the routes
    logger.warn('Direct SQL query called - should use Supabase client methods instead');
    throw new Error('Direct SQL queries not supported with Supabase client. Use Supabase client methods instead.');
  } catch (error) {
    logger.error('Query execution error:', error);
    throw error;
  }
};

// Get Supabase client instance
export const getSupabaseClient = () => supabase;

export default supabase;
