-- Criar tabela de perfis de usuários
-- Esta tabela armazena informações dos usuários que se cadastram no sistema

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Criar índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Criar índice para busca por status
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Política: Permitir inserção de perfil quando usuário é criado
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política: Admins podem ver todos os perfis (opcional - descomente se necessário)
-- CREATE POLICY "Admins can view all profiles"
--     ON user_profiles FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles
--             WHERE id = auth.uid() AND role = 'admin'
--         )
--     );

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Armazena informações dos usuários cadastrados no sistema';
COMMENT ON COLUMN user_profiles.id IS 'ID do usuário (referência ao auth.users)';
COMMENT ON COLUMN user_profiles.email IS 'Email do usuário';
COMMENT ON COLUMN user_profiles.name IS 'Nome completo do usuário';
COMMENT ON COLUMN user_profiles.phone IS 'Telefone do usuário';
COMMENT ON COLUMN user_profiles.last_login IS 'Data e hora do último login';
COMMENT ON COLUMN user_profiles.status IS 'Status do usuário: active, inactive, suspended';
COMMENT ON COLUMN user_profiles.role IS 'Papel do usuário: user ou admin';
COMMENT ON COLUMN user_profiles.metadata IS 'Dados adicionais em formato JSON';
