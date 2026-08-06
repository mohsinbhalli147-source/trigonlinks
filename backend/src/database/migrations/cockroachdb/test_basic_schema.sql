-- Test basic schema creation for CockroachDB
-- This is a minimal test to verify basic functionality

-- Test UUID generation
SELECT gen_random_uuid() as test_uuid;

-- Test table creation
CREATE TABLE IF NOT EXISTS test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL
);

-- Test CHECK constraint
CREATE TABLE IF NOT EXISTS test_enum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'pending'))
);

-- Test foreign key
CREATE TABLE IF NOT EXISTS test_parent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS test_child (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES test_parent(id),
    name VARCHAR(255) NOT NULL
);

-- Test index
CREATE INDEX IF NOT EXISTS idx_test_enum_status ON test_enum(status);

-- Cleanup (commented out for now)
-- DROP TABLE IF EXISTS test_child;
-- DROP TABLE IF EXISTS test_parent;
-- DROP TABLE IF EXISTS test_enum;
-- DROP TABLE IF EXISTS test_table;