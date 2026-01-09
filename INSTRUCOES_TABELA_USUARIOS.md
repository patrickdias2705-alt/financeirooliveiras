# 📋 Instruções: Criar Tabela de Usuários no Supabase

## 🎯 Objetivo

Criar uma tabela `user_profiles` no Supabase para armazenar informações dos usuários que se cadastram no sistema.

## 📝 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New Query** (ou use o atalho `Ctrl+K` / `Cmd+K`)

### 3. Executar o SQL

1. Abra o arquivo `CRIAR_TABELA_USUARIOS.sql` que está na raiz do projeto
2. Selecione TODO o conteúdo (Ctrl+A / Cmd+A)
3. Copie (Ctrl+C / Cmd+C)
4. Cole no SQL Editor do Supabase (Ctrl+V / Cmd+V)
5. Clique no botão **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
6. Aguarde a mensagem de sucesso

### 4. Verificar se a Tabela foi Criada

1. No menu lateral, clique em **Table Editor**
2. Você deve ver a tabela `user_profiles` na lista
3. Clique nela para ver a estrutura

## ✅ O que a Tabela Faz

A tabela `user_profiles` armazena:

- **id**: ID do usuário (referência ao auth.users)
- **email**: Email do usuário
- **name**: Nome completo
- **phone**: Telefone (opcional)
- **created_at**: Data de cadastro
- **updated_at**: Data da última atualização (atualizada automaticamente)
- **last_login**: Data do último login
- **status**: Status do usuário (active, inactive, suspended)
- **role**: Papel do usuário (user, admin)
- **metadata**: Dados adicionais em formato JSON

## 🔒 Segurança (RLS)

A tabela tem **Row Level Security (RLS)** habilitado, o que significa:

- ✅ Usuários podem ver apenas seu próprio perfil
- ✅ Usuários podem atualizar apenas seu próprio perfil
- ✅ Usuários podem inserir apenas seu próprio perfil
- ✅ Dados protegidos automaticamente

## 🔄 Funcionamento Automático

Após criar a tabela:

1. **Quando um usuário se cadastra**:
   - Um registro é criado automaticamente na tabela `user_profiles`
   - O sistema preenche: id, email, name, status, role

2. **Quando um usuário faz login**:
   - O campo `last_login` é atualizado automaticamente
   - Você pode ver quando cada usuário acessou pela última vez

## 📊 Consultar Usuários Cadastrados

Para ver todos os usuários cadastrados, você pode:

### Opção 1: Via Table Editor do Supabase

1. Acesse **Table Editor** no Supabase
2. Clique na tabela `user_profiles`
3. Veja todos os registros

### Opção 2: Via SQL Query

```sql
SELECT 
  id,
  email,
  name,
  created_at,
  last_login,
  status,
  role
FROM user_profiles
ORDER BY created_at DESC;
```

### Opção 3: Criar uma API (Futuro)

Você pode criar uma rota API para listar usuários (com permissões adequadas).

## ⚠️ Importante

- A tabela é criada automaticamente quando você executa o SQL
- Os dados são inseridos automaticamente quando usuários se cadastram
- O `last_login` é atualizado automaticamente a cada login
- A segurança RLS protege os dados automaticamente

## 🐛 Se Der Erro

### Erro: "relation already exists"
- A tabela já existe. Isso é normal se você já executou o SQL antes.
- Você pode ignorar ou usar `DROP TABLE IF EXISTS user_profiles;` antes de criar.

### Erro: "permission denied"
- Verifique se você está logado no Supabase
- Verifique se tem permissões no projeto

### Erro: "function already exists"
- A função `update_updated_at_column` já existe. Isso é normal.
- Você pode ignorar o erro.

## ✅ Checklist

- [ ] SQL Editor aberto no Supabase
- [ ] SQL do arquivo `CRIAR_TABELA_USUARIOS.sql` copiado
- [ ] SQL executado com sucesso
- [ ] Tabela `user_profiles` visível no Table Editor
- [ ] Testado cadastro de novo usuário
- [ ] Verificado que registro foi criado na tabela

---

**Pronto! Agora todos os usuários que se cadastrarem terão seus dados armazenados na tabela `user_profiles`.** 🎉
