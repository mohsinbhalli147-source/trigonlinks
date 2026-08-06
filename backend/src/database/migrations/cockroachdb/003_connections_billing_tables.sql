-- Migration 003: Connections and Billing Tables (CockroachDB Compatible)

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL REFERENCES areas(name),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in-progress', 'completed', 'on-hold', 'inactive', 'suspended')),
    assigned_staff UUID REFERENCES staff(id),
    technician_id UUID REFERENCES staff(id),
    installation_date BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_connections_customer_id ON connections(customer_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_area ON connections(area);
CREATE INDEX IF NOT EXISTS idx_connections_assigned_staff ON connections(assigned_staff);

-- Connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL REFERENCES areas(name),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in-progress', 'completed', 'on-hold', 'inactive', 'suspended')),
    contact_phone VARCHAR(50) NOT NULL,
    contact_address TEXT,
    installation_date BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_connection_requests_customer_id ON connection_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_area ON connection_requests(area);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    month VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    remaining_balance DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue')),
    due_date BIGINT,
    invoice_number VARCHAR(255) UNIQUE,
    generated_at BIGINT,
    paid_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(month);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date BIGINT,
    collected_by UUID REFERENCES staff(id),
    notes TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_collected_by ON payments(collected_by);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);