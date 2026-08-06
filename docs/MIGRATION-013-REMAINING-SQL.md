# Migration 013 - Remaining SQL to Execute

**Status:** Partially Complete - Execute these sections in order

## Section 11: Bulk Operations Tracking (Lines 158-187)

```sql
-- 11. Bulk Operations Tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type VARCHAR(50) NOT NULL,
  operation_config JSONB NOT NULL,
  target_customer_ids UUID[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  total_count INTEGER NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  started_at BIGINT,
  completed_at BIGINT,
  created_by UUID,
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
```

## Section 12: Package History (Lines 189-202)

```sql
-- 12. Package History (Track package changes)
CREATE TABLE IF NOT EXISTS customer_package_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
  old_package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  new_package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  change_reason TEXT,
  changed_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  changed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_package_history_customer ON customer_package_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_package_history_changed_at ON customer_package_history(changed_at DESC);
```

**Note:** If connections table doesn't exist, this may fail. Skip if error occurs.

## Section 13: Connection History (Lines 204-218)

```sql
-- 13. Connection History (Track connection status changes)
CREATE TABLE IF NOT EXISTS customer_connection_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  change_reason TEXT,
  changed_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  changed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_connection_history_customer ON customer_connection_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_connection_history_connection ON customer_connection_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_history_changed_at ON customer_connection_history(changed_at DESC);
```

**Note:** If connections table doesn't exist, this will fail. Skip if error occurs.

## Section 14: RLS Policies (Lines 220-306)

```sql
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
```

**Note:** Skip Connection History RLS if customer_connection_history table wasn't created.

## Section 15: Functions, Triggers, and Views (Lines 308-378)

```sql
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
```

**Note:** The view references connections table. If connections doesn't exist, this will fail or return 0 for connection_count.

## Verification Queries (After Completion)

```sql
-- Check Phase 2 Tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'customer_tags',
    'customer_labels', 
    'customer_documents',
    'customer_notes',
    'staff_notes',
    'family_accounts',
    'family_members',
    'customer_activity_timeline',
    'saved_filters',
    'bulk_operations',
    'bulk_operation_results',
    'customer_package_history',
    'customer_connection_history'
)
ORDER BY table_name;

-- Check New Columns in customers Table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('rating', 'priority', 'last_activity_at')
ORDER BY column_name;

-- Check View Created
SELECT view_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND view_name = 'customer_summary_advanced';

-- Check Functions Created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_customer_activity', 'update_customer_last_activity')
ORDER BY routine_name;

-- Check Triggers Created
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'trg_update_customer_last_activity';
```

## Execution Order

1. Section 11: Bulk Operations
2. Section 12: Package History (skip if connections error)
3. Section 13: Connection History (skip if connections error)
4. Section 14: RLS Policies (skip connection history RLS if table missing)
5. Section 15: Functions, Triggers, Views (may need modification if connections missing)
6. Verification Queries
