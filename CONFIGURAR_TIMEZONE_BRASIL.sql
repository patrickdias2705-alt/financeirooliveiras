-- Configurar timezone do banco de dados para São Paulo, Brasil (UTC-3)
-- Execute este SQL no Supabase SQL Editor APÓS executar ATUALIZAR_SCHEMA_PARCELAMENTO.sql

-- Configurar timezone padrão da sessão para São Paulo
SET timezone = 'America/Sao_Paulo';

-- Atualizar colunas de timestamp para usar timezone (se ainda não foram atualizadas)
ALTER TABLE orders 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
USING created_at AT TIME ZONE 'America/Sao_Paulo';

ALTER TABLE transactions 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
USING created_at AT TIME ZONE 'America/Sao_Paulo';

ALTER TABLE customers 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
USING created_at AT TIME ZONE 'America/Sao_Paulo';

ALTER TABLE installments 
ALTER COLUMN paid_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Definir timezone padrão para novas inserções
ALTER TABLE orders 
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE transactions 
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE customers 
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE installments 
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo');

-- Verificar timezone configurado
SHOW timezone;

