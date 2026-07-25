import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  console.log('Testing PostgreSQL connection...');
  console.log('Connection string:', connectionString?.replace(/:[^:]*@/, ':****@'));
  
  const pool = new Pool({
    connectionString,
  });
  
  try {
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Server time:', result.rows[0]);
    
    client.release();
    await pool.end();
    
    console.log('Connection test passed');
  } catch (error) {
    console.error('Connection test failed:', error);
    await pool.end();
    throw error;
  }
}

testConnection()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
