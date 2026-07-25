import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function executeSchemaInBatches() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Reading schema file...');
  const schemaPath = path.join(__dirname, '../src/database/schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  console.log('Schema loaded. Splitting into individual statements...');
  
  // Split by semicolon and filter
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*') && !s.startsWith('*'));
  
  console.log(`Found ${statements.length} statements to execute`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip if it's just whitespace or comments
    if (statement.length < 10) continue;
    
    try {
      console.log(`Executing statement ${i + 1}/${statements.length} (${statement.substring(0, 50)}...)`);
      
      // Try to execute via direct SQL using the REST API's SQL endpoint
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          query: statement,
        }),
      });
      
      if (response.ok) {
        successCount++;
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } else {
        const errorText = await response.text();
        console.warn(`✗ Statement ${i + 1} failed:`, errorText);
        failCount++;
      }
    } catch (error: any) {
      console.warn(`✗ Statement ${i + 1} error:`, error.message);
      failCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\nExecution complete: ${successCount} succeeded, ${failCount} failed`);
  
  if (failCount > 0) {
    console.log('\nNote: Some statements may have failed due to dependencies or existing objects.');
    console.log('Please verify the schema in Supabase Dashboard: https://supabase.com/dashboard/project/unvznjnwekrjobwfxhwn/database');
  }
}

executeSchemaInBatches()
  .then(() => {
    console.log('Schema execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema execution failed:', error);
    process.exit(1);
  });
