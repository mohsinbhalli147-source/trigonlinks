-- 007_create_connection_expenses.sql
-- Create connection_expenses table

CREATE TABLE IF NOT EXISTS connection_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  vendor VARCHAR(255),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_connection_expenses_connection_id ON connection_expenses(connection_id);
CREATE INDEX idx_connection_expenses_date ON connection_expenses(date);

-- RLS policies for connection_expenses
ALTER TABLE connection_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to connection_expenses" 
ON connection_expenses FOR ALL 
USING (
  auth.uid() IN (SELECT id FROM staff WHERE role = 'admin') OR
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Staff have select access to connection_expenses" 
ON connection_expenses FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM staff WHERE role = 'staff') OR
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'staff')
);

CREATE POLICY "Staff have insert access to connection_expenses" 
ON connection_expenses FOR INSERT 
WITH CHECK (
  auth.uid() IN (SELECT id FROM staff WHERE role = 'staff') OR
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'staff')
);

CREATE POLICY "Staff have update access to connection_expenses" 
ON connection_expenses FOR UPDATE 
USING (
  auth.uid() IN (SELECT id FROM staff WHERE role = 'staff') OR
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'staff')
);
