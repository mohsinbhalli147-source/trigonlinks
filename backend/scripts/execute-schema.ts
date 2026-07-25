import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

const pool = new Pool({
  connectionString,
  max: 1,
});

async function executeSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to Supabase PostgreSQL');
    
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    await client.query(schemaSQL);
    
    console.log('Schema executed successfully!');
  } catch (error) {
    console.error('Error executing schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

executeSchema()
  .then(() => {
    console.log('Schema execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema execution failed:', error);
    process.exit(1);
  });
