-- Migration 013: Phase 2 - Advanced Customer Management
-- This migration adds tables and columns for advanced customer management features

-- 1. Customer Tags System
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'important', 'warning', 'info'
  is_pinned BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID, -- Removed FK constraint - users table may not exist in public schema
  updated_at BIGINT,
  updated_by UUID, -- Removed FK constraint - users table may not exist in public schema
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_notes_is_pinned ON customer_notes(is_pinned);

-- 6. Internal Staff Notes (Private Notes)
CREATE TABLE IF NOT EXISTS staff_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_name VARCHAR(255) NOT NULL,
  primary_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE SET NULL,
  billing_type VARCHAR(20) DEFAULT 'individual' CHECK (billing_type IN ('individual', 'combined', 'split')),
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by UUID -- Removed FK constraint - users table may not exist in public schema
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_connections_customer_id ON connections(customer_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_connections_is_active ON connections(is_active);

-- 9. Activity Timeline
CREATE TABLE IF NOT EXISTS customer_activity_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type VARCHAR(50) NOT NULL, -- 'suspend', 'activate', 'package_change', 'billing', 'sms', 'whatsapp'
  operation_config JSONB NOT NULL,
  target_customer_ids UUID[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  total_count INTEGER NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  started_at BIGINT,
  completed_at BIGINT,
  created_by UUID, -- Removed FK constraint - users table may not exist in public schema
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  error_details JSONB
);

CREATE TABLE IF NOT EXISTS bulk_operation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bulk_operation_id UUID NOT NULL REFERENCES bulk_operations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  error_message TEXT,
  processed_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_by ON bulk_operations(created_by);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_operation ON bulk_operation_results(bulk_operation_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_customer ON bulk_operation_results(customer_id);

-- 12. Package History (Track package changes)
CREATE TABLE IF NOT EXISTS customer_package_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
  old_package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  new_package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  change_reason TEXT,
  changed_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  changed_by UUID -- Removed FK constraint - users table may not exist in public schema
);

CREATE INDEX IF NOT EXISTS idx_package_history_customer ON customer_package_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_package_history_changed_at ON customer_package_history(changed_at DESC);

-- 13. Connection History (Track connection status changes)
CREATE TABLE IF NOT EXISTS customer_connection_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  change_reason TEXT,
  changed_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  changed_by UUID -- Removed FK constraint - users table may not exist in public schema
);

CREATE INDEX IF NOT EXISTS idx_connection_history_customer ON customer_connection_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_connection_history_connection ON customer_connection_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_history_changed_at ON customer_connection_history(changed_at DESC);

-- 14. Add RLS Policies for new tables

-- Customer Tags RLS
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view customer tags" ON customer_tags FOR SELECT USING (true);
CREATE POLICY "Admins can insert customer tags" ON customer_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update customer tags" ON customer_tags FOR UPDATE USING (true);
CREATE POLICY "Admins can delete customer tags" ON customer_tags FOR DELETE USING (true);

-- Customer Labels RLS
ALTER TABLE customer_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view customer labels" ON customer_labels FOR SELECT USING (true);
CREATE POLICY "Admins can insert customer labels" ON customer_labels FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update customer labels" ON customer_labels FOR UPDATE USING (true);
CREATE POLICY "Admins can delete customer labels" ON customer_labels FOR DELETE USING (true);

-- Customer Documents RLS
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public documents" ON customer_documents FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can insert documents" ON customer_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update documents" ON customer_documents FOR UPDATE USING (true);
CREATE POLICY "Admins can delete documents" ON customer_documents FOR DELETE USING (true);

-- Customer Notes RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view customer notes" ON customer_notes FOR SELECT USING (true);
CREATE POLICY "Admins and staff can insert notes" ON customer_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins and staff can update their notes" ON customer_notes FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Admins can delete notes" ON customer_notes FOR DELETE USING (true);

-- Staff Notes RLS
ALTER TABLE staff_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view staff notes" ON staff_notes FOR SELECT USING (
  created_by = auth.uid() OR
  'admin' = ANY(visible_to_roles)
);
CREATE POLICY "Staff can insert staff notes" ON staff_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update their notes" ON staff_notes FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Admins can delete staff notes" ON staff_notes FOR DELETE USING (true);

-- Family Accounts RLS
ALTER TABLE family_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family accounts" ON family_accounts FOR SELECT USING (true);
CREATE POLICY "Admins can insert family accounts" ON family_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update family accounts" ON family_accounts FOR UPDATE USING (true);
CREATE POLICY "Admins can delete family accounts" ON family_accounts FOR DELETE USING (true);

-- Family Members RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family members" ON family_members FOR SELECT USING (true);
CREATE POLICY "Admins can insert family members" ON family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update family members" ON family_members FOR UPDATE USING (true);
CREATE POLICY "Admins can delete family members" ON family_members FOR DELETE USING (true);

-- Activity Timeline RLS
ALTER TABLE customer_activity_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view activity timeline" ON customer_activity_timeline FOR SELECT USING (true);
CREATE POLICY "System can insert activity" ON customer_activity_timeline FOR INSERT WITH CHECK (true);

-- Saved Filters RLS
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own filters" ON saved_filters FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own filters" ON saved_filters FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own filters" ON saved_filters FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own filters" ON saved_filters FOR DELETE USING (user_id = auth.uid());

-- Bulk Operations RLS
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own operations" ON bulk_operations FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert operations" ON bulk_operations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update operations" ON bulk_operations FOR UPDATE USING (true);

-- Bulk Operation Results RLS
ALTER TABLE bulk_operation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view operation results" ON bulk_operation_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM bulk_operations WHERE id = bulk_operation_id AND created_by = auth.uid())
);

-- Package History RLS
ALTER TABLE customer_package_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view package history" ON customer_package_history FOR SELECT USING (true);
CREATE POLICY "System can insert package history" ON customer_package_history FOR INSERT WITH CHECK (true);

-- Connection History RLS
ALTER TABLE customer_connection_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view connection history" ON customer_connection_history FOR SELECT USING (true);
CREATE POLICY "System can insert connection history" ON customer_connection_history FOR INSERT WITH CHECK (true);

-- 15. Create helper functions for activity timeline logging
CREATE OR REPLACE FUNCTION log_customer_activity(
  p_customer_id UUID,
  p_activity_type VARCHAR,
  p_activity_title VARCHAR,
  p_activity_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO customer_activity_timeline (
    customer_id, activity_type, activity_title, activity_description, metadata, created_by
  )
  VALUES (
    p_customer_id, p_activity_type, p_activity_title, p_activity_description, p_metadata, p_created_by
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create trigger to update last_activity_at on customers
CREATE OR REPLACE FUNCTION update_customer_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_customer_last_activity
AFTER INSERT ON customer_activity_timeline
FOR EACH ROW
EXECUTE FUNCTION update_customer_last_activity();

-- 17. Create view for customer summary with new fields
CREATE OR REPLACE VIEW customer_summary_advanced AS
SELECT 
  c.id,
  c.name,
  c.mobile,
  c.email,
  c.status,
  c.rating,
  c.priority,
  c.last_activity_at,
  c.area,
  c.package_id,
  p.name as package_name,
  p.monthly_fee,
  COUNT(DISTINCT conn.id) as connection_count,
  COUNT(DISTINCT ct.id) as tag_count,
  COUNT(DISTINCT cl.id) as label_count,
  COUNT(DISTINCT cd.id) as document_count,
  COUNT(DISTINCT cn.id) as note_count,
  COALESCE(SUM(i.amount - i.paid_amount), 0) as outstanding_balance
FROM customers c
LEFT JOIN packages p ON c.package_id = p.id
LEFT JOIN connections conn ON c.id = conn.customer_id AND conn.is_active = true
LEFT JOIN customer_tags ct ON c.id = ct.customer_id
LEFT JOIN customer_labels cl ON c.id = cl.customer_id
LEFT JOIN customer_documents cd ON c.id = cd.customer_id
LEFT JOIN customer_notes cn ON c.id = cn.customer_id
LEFT JOIN invoices i ON c.id = i.customer_id AND i.status IN ('unpaid', 'partial', 'overdue')
GROUP BY c.id, p.id;
