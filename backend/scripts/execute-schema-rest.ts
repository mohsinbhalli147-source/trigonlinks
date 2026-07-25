import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function executeSchemaViaREST() {
  try {
    console.log('Connecting to Supabase via REST API...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Schema file loaded successfully');
    console.log('Schema length:', schemaSQL.length, 'characters');
    
    // Use Supabase SQL execution via REST API
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: schemaSQL 
    });
    
    if (error) {
      console.error('Schema execution failed:', error);
      
      // Try alternative approach - execute via direct REST call
      console.log('Trying alternative approach...');
      
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ sql: schemaSQL }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('REST API execution failed:', errorText);
        throw new Error(`REST API failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Schema executed via REST API:', result);
    } else {
      console.log('Schema executed successfully via RPC:', data);
    }
    
    console.log('Schema execution completed');
  } catch (error) {
    console.error('Error executing schema:', error);
    throw error;
  }
}

executeSchemaViaREST()
  .then(() => {
    console.log('Schema execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema execution failed:', error);
    process.exit(1);
  });
