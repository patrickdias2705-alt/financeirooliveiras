# 🚀 Deploy no Vercel - Guia Completo

## 📋 Pré-requisitos

- ✅ Repositório no GitHub: https://github.com/patrickdias2705-alt/financeirooliveiras.git
- ✅ Conta no Vercel (pode criar com GitHub)
- ✅ Projeto Supabase configurado

## 🔧 Passo a Passo

### 1. Conectar Repositório ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New Project"**
4. Importe o repositório: `patrickdias2705-alt/financeirooliveiras`
5. Clique em **"Import"**

### 2. Configurar o Projeto

No painel de configuração do Vercel:

- **Framework Preset**: Next.js (detectado automaticamente)
- **Root Directory**: `.` (raiz do repositório)
- **Build Command**: `npm run build` (padrão)
- **Output Directory**: `.next` (padrão)
- **Install Command**: `npm install` (padrão)

### 3. ⚠️ IMPORTANTE: Configurar Variáveis de Ambiente

**Antes de fazer o deploy**, adicione as variáveis de ambiente:

1. Na tela de configuração, clique em **"Environment Variables"**
2. Adicione as seguintes variáveis:

#### Para Production, Preview e Development:

```
NEXT_PUBLIC_SUPABASE_URL = https://uuunnssmuelyndymzamo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_SCT36vcY2d48yXLue5xs9Q_ugF7fCKF
```

3. Marque todas as opções: **Production**, **Preview** e **Development**
4. Clique em **"Add"** para cada variável

### 4. Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. O Vercel irá:
   - Instalar dependências
   - Fazer build do projeto
   - Fazer deploy

### 5. Verificar Deploy

Após o deploy, você verá:
- ✅ URL de produção: `https://seu-projeto.vercel.app`
- ✅ Status: "Ready"

### 6. Testar o Sistema

1. Acesse a URL fornecida pelo Vercel
2. Você deve ver a tela de login
3. Crie uma conta ou faça login
4. Verifique se todas as funcionalidades estão funcionando

## 🗄️ Configuração do Banco de Dados

**IMPORTANTE**: Antes de usar o sistema, execute o schema SQL no Supabase:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o arquivo `schema.sql` que está na raiz do projeto
5. Execute também `CRIAR_TABELA_CATEGORIAS.sql` se necessário

## 🔄 Atualizações Futuras

Após fazer push para o repositório GitHub, o Vercel fará deploy automático:

```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

O Vercel detectará automaticamente e fará um novo deploy.

## 🐛 Troubleshooting

### Erro de Build

- Verifique se todas as dependências estão no `package.json`
- Verifique os logs do build no Vercel
- Certifique-se de que o Node.js está na versão 18+

### Erro de Autenticação

- Verifique se as variáveis de ambiente estão configuradas corretamente
- Verifique se está usando a **Anon Key** (não a Service Role Key)
- Verifique se o Supabase está ativo

### Erro 404 nas Rotas

- Verifique se o `next.config.mjs` está correto
- Verifique se as rotas estão no formato correto do Next.js 14

### Erro de Banco de Dados

- Verifique se executou o `schema.sql` no Supabase
- Verifique se todas as tabelas foram criadas
- Verifique as permissões RLS (Row Level Security) no Supabase

## 📞 Suporte

Se tiver problemas:
1. Verifique os **Build Logs** no Vercel
2. Verifique o **Console do navegador** (F12)
3. Verifique os **Logs do Supabase**

## ✅ Checklist Final

- [ ] Repositório conectado ao Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Schema SQL executado no Supabase
- [ ] Sistema testado e funcionando
- [ ] Login funcionando
- [ ] Dashboard acessível

---

**URL do Repositório**: https://github.com/patrickdias2705-alt/financeirooliveiras.git
