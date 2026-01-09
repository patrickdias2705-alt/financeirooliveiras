-- Atualizar schema para suportar parcelamento de vendas
-- Execute este SQL no Supabase SQL Editor
-- Este script configura o timezone para São Paulo, Brasil (UTC-3)

-- Configurar timezone padrão para São Paulo, Brasil
SET timezone = 'America/Sao_Paulo';

-- Adicionar colunas de parcelamento na tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_method_id INTEGER REFERENCES payment_methods(id);

-- Criar tabela de parcelas (installments)
CREATE TABLE IF NOT EXISTS installments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
);

-- Atualizar métodos de pagamento para português
UPDATE payment_methods SET name = 'Débito' WHERE name = 'Debit Card';
UPDATE payment_methods SET name = 'Crédito' WHERE name = 'Credit Card';
UPDATE payment_methods SET name = 'Pix' WHERE name = 'Cash';

-- Se não existirem, criar os métodos de pagamento em português
INSERT INTO payment_methods (name) 
VALUES ('Débito'), ('Crédito'), ('Pix')
ON CONFLICT (name) DO NOTHING;

-- Atualizar colunas de timestamp para usar timezone
ALTER TABLE orders 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
USING created_at AT TIME ZONE 'America/Sao_Paulo';

ALTER TABLE transactions 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
USING created_at AT TIME ZONE 'America/Sao_Paulo';

ALTER TABLE customers 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
USING created_at AT TIME ZONE 'America/Sao_Paulo';

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_installments_order_id ON installments(order_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

