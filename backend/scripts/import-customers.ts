import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { getSupabaseClient } from '../src/database/client';

const supabase = getSupabaseClient();

interface CSVRow {
  'Serial No': string;
  'Cust Id': string;
  'Name': string;
  'Cell No': string;
  'Area': string;
  'Fee Amount': string;
  'Balance': string;
  'Last Payment': string;
  'Pay Date': string;
  'Pkg Name': string;
  'Supervisor Name': string;
}

function parseFeeAmount(value: string): number {
  if (!value || value.trim() === '') return 0;
  const parsed = parseFloat(value.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

function parseBalance(value: string): number {
  if (!value || value.trim() === '') return 0;
  const parsed = parseFloat(value.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

function parseMobile(value: string): string {
  if (!value || value.trim() === '') return '';
  // Remove any non-digit characters except leading +
  return value.replace(/[^\d+]/g, '');
}

function generateUid(custId: string): string {
  // Use custId as base, or generate random UUID if empty
  if (custId && custId.trim() !== '') {
    return custId.trim().replace(/\s+/g, '-').toLowerCase();
  }
  return randomUUID();
}

function generateUsername(name: string, index: number): string {
  // Generate username from name + index to ensure uniqueness
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleanName}${index}`;
}

async function ensureAreaExists(areaName: string) {
  if (!areaName || areaName.trim() === '') return;
  
  const { data: existingArea } = await supabase
    .from('areas')
    .select('id')
    .eq('name', areaName)
    .single();

  if (existingArea) return;

  // Create the area if it doesn't exist
  const { error: insertError } = await supabase
    .from('areas')
    .insert({
      id: randomUUID(),
      name: areaName,
      status: 'active',
      created_at: Date.now(),
    });

  if (insertError) {
    console.error(`Failed to create area ${areaName}:`, insertError.message);
  } else {
    console.log(`Created area: ${areaName}`);
  }
}

async function importCustomers() {
  try {
    console.log('Starting customer import...');

    // Read CSV file
    const csvContent = readFileSync('./scripts/customers-import.csv', 'utf-8');
    
    // Parse CSV
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    console.log(`Found ${records.length} records in CSV`);
    console.log('Sample record:', JSON.stringify(records[0], null, 2));

    // First, collect all unique areas and ensure they exist
    const uniqueAreas = new Set(records.map((r: any) => r['Area']).filter(a => a && a.trim() !== ''));
    console.log(`Found ${uniqueAreas.size} unique areas in CSV`);
    console.log('Areas:', Array.from(uniqueAreas).slice(0, 10));
    
    for (const area of uniqueAreas) {
      await ensureAreaExists(area);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process records in batches
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}...`);

      for (const row of batch) {
        try {
          const customerData = {
            id: randomUUID(),
            uid: generateUid(row['Cust Id']),
            name: row['Name'] || 'Unknown',
            username: generateUsername(row['Name'] || 'unknown', successCount + errorCount),
            cnic: '3460212345678',
            mobile: parseMobile(row['Cell No']),
            area: row['Area'] || 'Unknown',
            status: 'active' as const,
            package: row['Pkg Name'] || 'Unknown',
            fee: parseFeeAmount(row['Fee Amount']),
            previous_balance: parseBalance(row['Balance']),
            billing_date: 1, // Set billing date to 1st of month
            iptv_enabled: false,
            iptv_monthly_charges: 0,
            live_ip_enabled: false,
            live_ip_monthly_fee: 0,
            created_at: Date.now(),
            notes: row['Supervisor Name'] ? `Supervisor: ${row['Supervisor Name']}` : undefined,
          };

          // Check if customer with same mobile already exists
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('mobile', customerData.mobile)
            .single();

          let error;
          if (existingCustomer) {
            // Update existing customer
            console.log(`Updating existing customer: ${customerData.name} (${customerData.mobile})`);
            const { error: updateError } = await supabase
              .from('customers')
              .update({
                name: customerData.name,
                username: customerData.username,
                cnic: customerData.cnic,
                area: customerData.area,
                package: customerData.package,
                fee: customerData.fee,
                previous_balance: customerData.previous_balance,
                billing_date: customerData.billing_date,
                notes: customerData.notes,
                updated_at: Date.now()
              })
              .eq('id', existingCustomer.id);
            error = updateError;
          } else {
            // Insert new customer
            const { error: insertError } = await supabase
              .from('customers')
              .insert(customerData);
            error = insertError;
          }

          if (error) {
            throw error;
          }

          successCount++;
          console.log(`Imported: ${customerData.name} (${customerData.mobile})`);
        } catch (error: any) {
          errorCount++;
          const errorMsg = `Failed to import ${row['Name']}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total records: ${records.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Skipped (duplicates): ${records.length - successCount - errorCount}`);

    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\nImport completed!');
  } catch (error: any) {
    console.error('Fatal error during import:', error);
    process.exit(1);
  }
}

// Run import
importCustomers();
