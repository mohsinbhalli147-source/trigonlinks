import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration009() {
  console.log('Running migration 009: Add read_at column to notifications table...');
  
  // Use PostgreSQL pool for direct SQL execution
  const pgPool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DB_SSL_ROOT_CERT
      ? { ca: fs.readFileSync(process.env.DB_SSL_ROOT_CERT).toString(), rejectUnauthorized: true }
      : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const migrationPath = path.join(__dirname, 'files', '009_add_read_at_column.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing SQL:', sql);
    
    await pgPool.query(sql);
    
    console.log('✓ Migration 009 completed successfully');
    
    // Verify the column was added
    const checkResult = await pgPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'read_at'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✓ Verified: read_at column exists in notifications table');
      console.log('  Column details:', checkResult.rows[0]);
    } else {
      console.log('✗ Warning: read_at column not found after migration');
    }
    
  } catch (error: any) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await pgPool.end();
  }
}

runMigration009()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
