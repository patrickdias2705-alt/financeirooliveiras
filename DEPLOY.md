# 🚀 Guia de Deploy no Vercel

## Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em "New repository"
3. Nome: `controle-financeiro-oliveiras` (ou outro nome de sua preferência)
4. Deixe como **Private** (recomendado)
5. **NÃO** inicialize com README, .gitignore ou licença
6. Clique em "Create repository"

## Passo 2: Fazer Push do Código

### Opção A: Usando Git (se tiver instalado)

```bash
cd "c:\trabalhos geral\controle financeiro\pos-system"

# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Sistema completo de controle financeiro"

# Adicionar remote do GitHub
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git

# Fazer push
git branch -M main
git push -u origin main
```

### Opção B: Usando GitHub Desktop ou GitHub CLI

1. Instale o [GitHub Desktop](https://desktop.github.com/)
2. Abra o GitHub Desktop
3. File > Add Local Repository
4. Selecione a pasta `pos-system`
5. Faça commit e push

## Passo 3: Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New Project"
4. Importe o repositório que você acabou de criar
5. Configure o projeto:
   - **Framework Preset**: Next.js (deve detectar automaticamente)
   - **Root Directory**: `pos-system` (se o repositório estiver na raiz) ou `.` (se o repositório for só o pos-system)
   - **Build Command**: `npm run build` (já configurado)
   - **Output Directory**: `.next` (padrão do Next.js)

6. **IMPORTANTE**: Adicione as variáveis de ambiente:
   - Clique em "Environment Variables"
   - Adicione:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://uuunnssmuelyndymzamo.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_SCT36vcY2d48yXLue5xs9Q_ugF7fCKF
     ```

7. Clique em "Deploy"
8. Aguarde o build (pode levar 2-5 minutos)
9. Seu site estará disponível em `https://seu-projeto.vercel.app`

## Passo 4: Configurar Domínio Personalizado (Opcional)

1. No painel do Vercel, vá em Settings > Domains
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar DNS

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

- [ ] Site carrega corretamente
- [ ] Página de login aparece
- [ ] É possível fazer login
- [ ] Todas as páginas do admin funcionam
- [ ] API routes respondem corretamente

## 🔧 Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Verifique se as variáveis de ambiente estão configuradas

### Erro de Autenticação
- Verifique se as variáveis do Supabase estão corretas
- Verifique se o Supabase está configurado corretamente

### Erro 404 nas rotas
- Verifique se o `next.config.mjs` está correto
- Verifique se as rotas estão no formato correto do Next.js 14

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs do Vercel (Build Logs)
2. Console do navegador (F12)
3. Logs do Supabase

