-- Schema Melhorado do Sistema Financeiro
-- Execute este SQL no Supabase SQL Editor
-- Este script adiciona todos os campos necessários para as funcionalidades solicitadas

-- ============================================
-- 1. ATUALIZAR TABELA ORDERS
-- ============================================
-- Adicionar campos de observação e data editável
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS order_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Criar índice para order_date
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- ============================================
-- 2. ATUALIZAR TABELA TRANSACTIONS (DESPESAS)
-- ============================================
-- Adicionar parcelamento nas despesas
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Criar tabela de parcelas de despesas
CREATE TABLE IF NOT EXISTS expense_installments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_installments_transaction_id ON expense_installments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_expense_installments_due_date ON expense_installments(due_date);

-- ============================================
-- 3. ATUALIZAR TABELA CUSTOMERS
-- ============================================
-- Adicionar campo de categoria (novo, ativo, hibernando)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_category VARCHAR(20) DEFAULT 'novo' CHECK (customer_category IN ('novo', 'ativo', 'hibernando'));

-- Criar índice para categoria
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(customer_category);

-- ============================================
-- 4. ATUALIZAR TABELA PRODUCTS
-- ============================================
-- Garantir que category existe
ALTER TABLE products
ALTER COLUMN category TYPE VARCHAR(100);

-- ============================================
-- 5. CRIAR TABELA DE CATEGORIAS (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir categoria "Presencial" se não existir
INSERT INTO categories (name, description) 
VALUES ('Presencial', 'Vendas realizadas presencialmente')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 6. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. FUNÇÃO PARA RETORNAR PRODUTOS AO ESTOQUE AO CANCELAR
-- ============================================
CREATE OR REPLACE FUNCTION return_products_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'cancelled'
    IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
        -- Retornar produtos ao estoque
        UPDATE products p
        SET in_stock = p.in_stock + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND oi.product_id = p.id
        AND p.user_uid = NEW.user_uid;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para retornar produtos ao cancelar
DROP TRIGGER IF EXISTS trigger_return_products_on_cancel ON orders;
CREATE TRIGGER trigger_return_products_on_cancel
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled'))
    EXECUTE FUNCTION return_products_on_cancel();

-- ============================================
-- 8. FUNÇÃO PARA ATUALIZAR CATEGORIA DO CLIENTE
-- ============================================
-- Clientes novos: categoria 'novo' (padrão)
-- Clientes ativos: última compra há menos de 60 dias
-- Clientes hibernando: última compra há mais de 60 dias

CREATE OR REPLACE FUNCTION update_customer_category()
RETURNS TRIGGER AS $$
DECLARE
    days_since_last_order INTEGER;
BEGIN
    -- Calcular dias desde a última compra
    SELECT COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - MAX(o.created_at::date))), 999)
    INTO days_since_last_order
    FROM orders o
    WHERE o.customer_id = NEW.customer_id
    AND o.status != 'cancelled';
    
    -- Atualizar categoria baseado nos dias
    IF days_since_last_order >= 60 THEN
        UPDATE customers
        SET customer_category = 'hibernando'
        WHERE id = NEW.customer_id;
    ELSIF days_since_last_order < 60 AND days_since_last_order >= 0 THEN
        UPDATE customers
        SET customer_category = 'ativo'
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar categoria do cliente
DROP TRIGGER IF EXISTS trigger_update_customer_category ON orders;
CREATE TRIGGER trigger_update_customer_category
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status != 'cancelled')
    EXECUTE FUNCTION update_customer_category();

-- ============================================
-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================
COMMENT ON COLUMN orders.notes IS 'Observações sobre a compra';
COMMENT ON COLUMN orders.order_date IS 'Data editável do pedido';
COMMENT ON COLUMN transactions.installments IS 'Número de parcelas da despesa';
COMMENT ON COLUMN transactions.installment_value IS 'Valor de cada parcela';
COMMENT ON COLUMN transactions.transaction_date IS 'Data editável da transação';
COMMENT ON COLUMN customers.customer_category IS 'Categoria do cliente: novo, ativo, hibernando';
