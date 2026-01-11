-- ============================================
-- SCHEMA CORRIGIDO E COMPLETO
-- Execute este SQL no Supabase SQL Editor
-- Este script corrige todos os problemas identificados
-- ============================================

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- ============================================
-- 1. CORRIGIR TABELA CUSTOMERS
-- ============================================
-- Garantir que customer_category existe e está correta
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_category VARCHAR(20) DEFAULT 'novo';

-- Remover constraint antiga se existir e criar nova
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_customer_category_check;

ALTER TABLE customers
ADD CONSTRAINT customers_customer_category_check 
CHECK (customer_category IN ('novo', 'ativo', 'hibernando'));

-- Atualizar valores padrão
UPDATE customers 
SET customer_category = 'novo' 
WHERE customer_category IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(customer_category);

-- ============================================
-- 2. CORRIGIR TABELA PRODUCTS
-- ============================================
-- Garantir que category_id existe (se não existir, criar)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        -- Se category_id não existe, criar
        ALTER TABLE products ADD COLUMN category_id INTEGER;
        
        -- Se category existe como string, tentar mapear para category_id
        -- (isso será feito manualmente ou via código)
    END IF;
END $$;

-- Garantir que category existe como fallback
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Criar tabela categories se não existir
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    user_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
);

-- Inserir categoria "Presencial" se não existir
INSERT INTO categories (name, description) 
VALUES ('Presencial', 'Vendas realizadas presencialmente')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. CORRIGIR TABELA ORDERS
-- ============================================
-- Garantir que todos os campos existem
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS order_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_installments ON orders(installments);

-- ============================================
-- 4. GARANTIR TABELA INSTALLMENTS EXISTE
-- ============================================
CREATE TABLE IF NOT EXISTS installments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    user_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
);

CREATE INDEX IF NOT EXISTS idx_installments_order_id ON installments(order_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_paid ON installments(paid);

-- ============================================
-- 5. CORRIGIR TABELA TRANSACTIONS
-- ============================================
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 6. GARANTIR TABELA EXPENSE_INSTALLMENTS EXISTE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_installments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    user_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
);

CREATE INDEX IF NOT EXISTS idx_expense_installments_transaction_id ON expense_installments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_expense_installments_due_date ON expense_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_expense_installments_paid ON expense_installments(paid);

-- ============================================
-- 7. FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_installments_updated_at ON installments;
CREATE TRIGGER update_installments_updated_at 
    BEFORE UPDATE ON installments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_installments_updated_at ON expense_installments;
CREATE TRIGGER update_expense_installments_updated_at 
    BEFORE UPDATE ON expense_installments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para retornar produtos ao estoque ao cancelar
CREATE OR REPLACE FUNCTION return_products_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
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

DROP TRIGGER IF EXISTS trigger_return_products_on_cancel ON orders;
CREATE TRIGGER trigger_return_products_on_cancel
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled'))
    EXECUTE FUNCTION return_products_on_cancel();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Installments
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own installments" ON installments;
CREATE POLICY "Users can view their own installments" ON installments 
    FOR SELECT USING (auth.uid() = user_uid);
DROP POLICY IF EXISTS "Users can update their own installments" ON installments;
CREATE POLICY "Users can update their own installments" ON installments 
    FOR UPDATE USING (auth.uid() = user_uid);
DROP POLICY IF EXISTS "Users can create their own installments" ON installments;
CREATE POLICY "Users can create their own installments" ON installments 
    FOR INSERT WITH CHECK (auth.uid() = user_uid);

-- Expense Installments
ALTER TABLE expense_installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own expense installments" ON expense_installments;
CREATE POLICY "Users can view their own expense installments" ON expense_installments 
    FOR SELECT USING (auth.uid() = user_uid);
DROP POLICY IF EXISTS "Users can update their own expense installments" ON expense_installments;
CREATE POLICY "Users can update their own expense installments" ON expense_installments 
    FOR UPDATE USING (auth.uid() = user_uid);
DROP POLICY IF EXISTS "Users can create their own expense installments" ON expense_installments;
CREATE POLICY "Users can create their own expense installments" ON expense_installments 
    FOR INSERT WITH CHECK (auth.uid() = user_uid);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories" ON categories 
    FOR SELECT USING (auth.uid() = user_uid OR TRUE);
DROP POLICY IF EXISTS "Users can create categories" ON categories;
CREATE POLICY "Users can create categories" ON categories 
    FOR INSERT WITH CHECK (auth.uid() = user_uid);

-- ============================================
-- 9. COMENTÁRIOS
-- ============================================
COMMENT ON COLUMN customers.customer_category IS 'Categoria do cliente: novo, ativo, hibernando';
COMMENT ON COLUMN orders.installments IS 'Número de parcelas do pedido';
COMMENT ON COLUMN orders.installment_value IS 'Valor de cada parcela';
COMMENT ON COLUMN orders.notes IS 'Observações sobre a compra';
COMMENT ON COLUMN transactions.installments IS 'Número de parcelas da despesa';
