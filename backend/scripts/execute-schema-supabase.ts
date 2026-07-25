import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function executeSchema() {
  try {
    console.log('Connecting to Supabase...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Splitting schema into individual statements...');
    // Split by semicolon and filter empty statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`Statement ${i + 1} failed (may be expected):`, error.message);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err: any) {
        console.warn(`Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('Schema execution completed');
  } catch (error) {
    console.error('Error executing schema:', error);
    throw error;
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
