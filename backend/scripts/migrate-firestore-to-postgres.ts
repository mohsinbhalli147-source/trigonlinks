import { db } from '../src/firebase';
import { query } from '../src/database/client';

// Collection names in Firestore and their corresponding PostgreSQL tables
const COLLECTIONS = [
  { firestore: 'users', table: 'users' },
  { firestore: 'customers', table: 'customers' },
  { firestore: 'staff', table: 'staff' },
  { firestore: 'areas', table: 'areas' },
  { firestore: 'packages', table: 'packages' },
  { firestore: 'connections', table: 'connections' },
  { firestore: 'invoices', table: 'invoices' },
  { firestore: 'payments', table: 'payments' },
  { firestore: 'expenses', table: 'expenses' },
  { firestore: 'inventory', table: 'inventory' },
  { firestore: 'announcements', table: 'announcements' },
  { firestore: 'complaints', table: 'complaints' },
  { firestore: 'notifications', table: 'notifications' },
  { firestore: 'logs', table: 'logs' },
] as const;

// Convert camelCase to snake_case
const camelToSnake = (str: string): string => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
};

// Convert object keys from camelCase to snake_case
const convertKeysToSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToSnakeCase(item));
  }

  const converted: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = convertKeysToSnakeCase(obj[key]);
    }
  }
  return converted;
};

// Get column names for a table
const getTableColumns = async (tableName: string): Promise<string[]> => {
  const result = await query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
    [tableName]
  );
  return result.rows.map((row: any) => row.column_name);
};

// Insert data into PostgreSQL table
const insertData = async (tableName: string, data: any[]): Promise<number> => {
  if (data.length === 0) return 0;

  const columns = await getTableColumns(tableName);
  const filteredColumns = columns.filter(col => col !== 'id'); // Exclude auto-generated id

  const values = data.map(row => {
    const rowValues: any[] = [];
    filteredColumns.forEach(col => {
      rowValues.push(row[col] !== undefined ? row[col] : null);
    });
    return rowValues;
  });

  const placeholders = filteredColumns.map((_, i) => `$${i + 1}`).join(', ');
  const valuePlaceholders = values.map((_, rowIndex) => {
    const offset = rowIndex * filteredColumns.length;
    return `(${filteredColumns.map((_, i) => `$${offset + i + 1}`).join(', ')})`;
  }).join(', ');

  const flatValues = values.flat();

  const queryText = `
    INSERT INTO ${tableName} (${filteredColumns.join(', ')})
    VALUES ${valuePlaceholders}
    ON CONFLICT (id) DO UPDATE SET ${filteredColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}
  `;

  await query(queryText, flatValues);
  return data.length;
};

// Migrate a single collection
const migrateCollection = async (collectionName: string, tableName: string, dryRun: boolean = false): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    console.log(`\n📦 Migrating ${collectionName} -> ${tableName}...`);

    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`✅ No data in ${collectionName}`);
      return { success: true, count: 0 };
    }

    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      const converted = convertKeysToSnakeCase(docData);
      // Include the document ID
      converted.id = doc.id;
      return converted;
    });

    console.log(`📊 Found ${data.length} documents in ${collectionName}`);

    if (dryRun) {
      console.log(`🔍 Dry run: Would insert ${data.length} records into ${tableName}`);
      return { success: true, count: data.length };
    }

    const inserted = await insertData(tableName, data);
    console.log(`✅ Successfully inserted ${inserted} records into ${tableName}`);

    return { success: true, count: inserted };
  } catch (error: any) {
    console.error(`❌ Error migrating ${collectionName}:`, error.message);
    return { success: false, count: 0, error: error.message };
  }
};

// Main migration function
const migrateAll = async (dryRun: boolean = false) => {
  console.log('='.repeat(60));
  console.log('🚀 Starting Firestore to PostgreSQL Migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no data will be inserted)' : 'LIVE MIGRATION'}`);

  const results: Array<{ collection: string; table: string; success: boolean; count: number; error?: string }> = [];

  for (const { firestore, table } of COLLECTIONS) {
    const result = await migrateCollection(firestore, table, dryRun);
    results.push({ collection: firestore, table, ...result });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Migration Summary');
  console.log('='.repeat(60));

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalRecords = 0;

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.collection} -> ${result.table}: ${result.count} records`);
      totalSuccess++;
      totalRecords += result.count;
    } else {
      console.log(`❌ ${result.collection} -> ${result.table}: FAILED - ${result.error}`);
      totalFailed++;
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total Collections: ${results.length}`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Total Records Migrated: ${dryRun ? '(dry run)' : totalRecords}`);
  console.log('='.repeat(60));

  if (totalFailed > 0) {
    console.error('\n⚠️  Migration completed with errors. Please review the failed collections above.');
    process.exit(1);
  } else {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  }
};

// CLI interface
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

migrateAll(dryRun).catch(error => {
  console.error('Fatal error during migration:', error);
  process.exit(1);
});
