ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS preferred_date BIGINT;
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS preferred_time_slot VARCHAR(50);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS equipment_needed JSONB;