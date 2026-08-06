-- Migration 013: Phase 2 - Advanced Customer Management (CockroachDB Compatible)
-- This migration adds tables and columns for advanced customer management features
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- 1. Customer Tags System
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  tag_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID, -- Removed FK constraint - users table may not exist in public schema
  UNIQUE(customer_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id ON customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_tag_name ON customer_tags(tag_name);

-- 2. Customer Labels System
CREATE TABLE IF NOT EXISTS customer_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label_name VARCHAR(100) NOT NULL,
  label_type VARCHAR(50) NOT NULL, -- 'priority', 'status', 'custom'
  label_color VARCHAR(7) DEFAULT '#10B981',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID, -- Removed FK constraint - users table may not exist in public schema
  UNIQUE(customer_id, label_name, label_type)
);

CREATE INDEX IF NOT EXISTS idx_customer_labels_customer_id ON customer_labels(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_labels_type ON customer_labels(label_type);

-- 3. Customer Rating and Priority
ALTER TABLE customers ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_activity_at BIGINT;

-- 4. Documents Management
CREATE TABLE IF NOT EXISTS customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'id_card', 'contract', 'invoice', 'receipt', 'other'
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  description TEXT,
  uploaded_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  uploaded_by UUID, -- Removed FK constraint - users table may not exist in public schema
  is_public BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type ON customer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_customer_documents_uploaded_at ON customer_documents(uploaded_at);

-- 5. Notes System (Customer Notes)
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'important', 'warning', 'info'
  is_pinned BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID, -- Removed FK constraint - users table may not exist in public schema
  updated_at BIGINT,
  updated_by UUID -- Removed FK constraint - users table may not exist in public schema
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_notes_is_pinned ON customer_notes(is_pinned);

-- 6. Internal Staff Notes (Private Notes)
CREATE TABLE IF NOT EXISTS staff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_category VARCHAR(50) DEFAULT 'internal', -- 'internal', 'compliance', 'risk', 'support'
  is_sensitive BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID, -- Removed FK constraint - users table may not exist in public schema
  updated_at BIGINT,
  updated_by UUID, -- Removed FK constraint - users table may not exist in public schema
  visible_to_roles TEXT[] DEFAULT ARRAY['admin'] -- Array of roles that can view
);

CREATE INDEX IF NOT EXISTS idx_staff_notes_customer_id ON staff_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_staff_notes_created_by ON staff_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_staff_notes_category ON staff_notes(note_category);

-- 7. Family Accounts
CREATE TABLE IF NOT EXISTS family_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name VARCHAR(255) NOT NULL,
  primary_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE SET NULL,
  billing_type VARCHAR(20) DEFAULT 'individual' CHECK (billing_type IN ('individual', 'combined', 'split')),
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID -- Removed FK constraint - users table may not exist in public schema
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_account_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL, -- 'primary', 'spouse', 'child', 'parent', 'other'
  is_billing_contact BOOLEAN DEFAULT false,
  joined_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE(family_account_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_family_accounts_primary ON family_accounts(primary_customer_id);
CREATE INDEX IF NOT EXISTS idx_family_members_account ON family_members(family_account_id);
CREATE INDEX IF NOT EXISTS idx_family_members_customer ON family_members(customer_id);

-- 8. Multiple Connections per Customer (Modify connections table)
ALTER TABLE connections ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) DEFAULT 'primary' CHECK (connection_type IN ('primary', 'secondary', 'additional'));
ALTER TABLE connections ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS suspended_at BIGINT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS suspended_by UUID; -- Removed FK constraint - users table may not exist in public schema
ALTER TABLE connections ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_connections_customer_id_new ON connections(customer_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_connections_is_active ON connections(is_active);

-- 9. Activity Timeline
CREATE TABLE IF NOT EXISTS customer_activity_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'payment', 'complaint', 'package_change', 'connection_update', 'note_added', 'document_uploaded', 'status_change'
  activity_title VARCHAR(255) NOT NULL,
  activity_description TEXT,
  metadata JSONB,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID -- Removed FK constraint - users table may not exist in public schema
);

CREATE INDEX IF NOT EXISTS idx_activity_timeline_customer_id ON customer_activity_timeline(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_type ON customer_activity_timeline(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_created_at ON customer_activity_timeline(created_at DESC);

-- 10. Saved Filters
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Removed FK constraint - users table may not exist in public schema
  filter_name VARCHAR(255) NOT NULL,
  filter_type VARCHAR(50) NOT NULL, -- 'customers', 'connections', 'invoices', 'complaints'
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_type ON saved_filters(filter_type);

-- 11. Bulk Operations Tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL, -- 'suspend', 'activate', 'package_change', 'billing', 'sms', 'whatsapp'
  operation_config JSONB NOT NULL,
  target_customer_ids UUID[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  total_targets INTEGER NOT NULL,
  completed_targets INTEGER DEFAULT 0,
  failed_targets INTEGER DEFAULT 0,
  error_messages JSONB DEFAULT '[]',
  started_at BIGINT,
  completed_at BIGINT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID -- Removed FK constraint - users table may not exist in public schema
);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_type ON bulk_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at ON bulk_operations(created_at);
