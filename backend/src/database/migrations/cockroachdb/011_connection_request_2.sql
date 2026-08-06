ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_cnic VARCHAR(50);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS preferred_date BIGINT;
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS preferred_time_slot VARCHAR(50);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS equipment_needed JSONB;

CREATE INDEX IF NOT EXISTS idx_connection_requests_customer_uid ON connection_requests(customer_uid);
CREATE INDEX IF NOT EXISTS idx_connection_requests_preferred_date ON connection_requests(preferred_date);