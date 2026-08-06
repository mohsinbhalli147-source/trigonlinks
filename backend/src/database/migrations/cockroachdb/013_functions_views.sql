-- Migration 013: Functions and Views (CockroachDB Compatible)
-- From migration 002

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    invoice_num VARCHAR;
    date_part VARCHAR;
    seq_part INTEGER;
BEGIN
    date_part := TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMM');
    SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1
    INTO seq_part
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || date_part || '-%';
    
    invoice_num := 'INV-' || date_part || '-' || LPAD(seq_part::TEXT, 4, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update expense category spent amount
CREATE OR REPLACE FUNCTION update_expense_category_spent_manual(category_name VARCHAR, amount DECIMAL, operation VARCHAR)
RETURNS VOID AS $$
BEGIN
    IF operation = 'insert' THEN
        UPDATE expense_categories
        SET spent = spent + amount
        WHERE name = category_name;
    ELSIF operation = 'update' THEN
        UPDATE expense_categories
        SET spent = spent + amount
        WHERE name = category_name;
    ELSIF operation = 'delete' THEN
        UPDATE expense_categories
        SET spent = spent - amount
        WHERE name = category_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory quantity on transaction
CREATE OR REPLACE FUNCTION update_inventory_quantity_manual(item_id_param UUID, quantity_param INTEGER, type_param VARCHAR)
RETURNS VOID AS $$
BEGIN
    IF type_param = 'in' THEN
        UPDATE inventory
        SET qty = qty + quantity_param,
            updated_at = CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)
        WHERE id = item_id_param;
    ELSIF type_param = 'out' THEN
        UPDATE inventory
        SET qty = qty - quantity_param,
            updated_at = CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)
        WHERE id = item_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT) - CAST(30 * 24 * 60 * 60 * 1000 AS BIGINT);
END;
$$ LANGUAGE plpgsql;

-- Function to mark overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS VOID AS $$
BEGIN
    UPDATE invoices
    SET status = 'overdue',
        updated_at = CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)
    WHERE status = 'unpaid'
    AND due_date < CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
END;
$$ LANGUAGE plpgsql;