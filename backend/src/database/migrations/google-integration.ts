import { getSupabaseClient } from '../client';
import { logger } from '../../utils/logger';

/**
 * Migration: Google Contacts Integration
 * Creates tables for storing OAuth tokens and sync status
 */
export async function up() {
  const supabase = getSupabaseClient();

  try {
    logger.info('Running Google Integration migration...');

    // Create google_oauth_tokens table
    const { error: tokensError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'google_oauth_tokens',
      table_definition: `
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        token_type TEXT DEFAULT 'Bearer',
        expires_at BIGINT NOT NULL,
        scope TEXT NOT NULL,
        email TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
        updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
      `
    });

    if (tokensError && !tokensError.message.includes('already exists')) {
      throw tokensError;
    }

    // Create google_contacts_sync table
    const { error: syncError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'google_contacts_sync',
      table_definition: `
        id BIGSERIAL PRIMARY KEY,
        customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        google_contact_id TEXT,
        google_resource_id TEXT,
        sync_status TEXT DEFAULT 'pending',
        last_sync_at BIGINT,
        sync_error TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
        updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
        UNIQUE(customer_id)
      `
    });

    if (syncError && !syncError.message.includes('already exists')) {
      throw syncError;
    }

    // Create sync_queue table for background sync
    const { error: queueError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'sync_queue',
      table_definition: `
        id BIGSERIAL PRIMARY KEY,
        operation TEXT NOT NULL,
        customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
        contact_data JSONB,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
        processed_at BIGINT,
        scheduled_for BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
      `
    });

    if (queueError && !queueError.message.includes('already exists')) {
      throw queueError;
    }

    // Create sync_logs table for tracking sync history
    const { error: logsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'sync_logs',
      table_definition: `
        id BIGSERIAL PRIMARY KEY,
        operation TEXT NOT NULL,
        customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
        google_contact_id TEXT,
        status TEXT NOT NULL,
        error_message TEXT,
        duration_ms INTEGER,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
      `
    });

    if (logsError && !logsError.message.includes('already exists')) {
      throw logsError;
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_is_active ON google_oauth_tokens(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_google_contacts_sync_customer_id ON google_contacts_sync(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_google_contacts_sync_sync_status ON google_contacts_sync(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_google_contacts_sync_google_contact_id ON google_contacts_sync(google_contact_id)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled_for ON sync_queue(scheduled_for)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority DESC)',
      'CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC)'
    ];

    for (const indexSql of indexes) {
      await supabase.rpc('execute_sql', { sql: indexSql });
    }

    logger.info('Google Integration migration completed successfully');
  } catch (error) {
    logger.error('Google Integration migration failed:', error);
    throw error;
  }
}

export async function down() {
  const supabase = getSupabaseClient();

  try {
    logger.info('Rolling back Google Integration migration...');

    // Drop tables in reverse order
    await supabase.rpc('drop_table_if_exists', { table_name: 'sync_logs' });
    await supabase.rpc('drop_table_if_exists', { table_name: 'sync_queue' });
    await supabase.rpc('drop_table_if_exists', { table_name: 'google_contacts_sync' });
    await supabase.rpc('drop_table_if_exists', { table_name: 'google_oauth_tokens' });

    logger.info('Google Integration rollback completed successfully');
  } catch (error) {
    logger.error('Google Integration rollback failed:', error);
    throw error;
  }
}
