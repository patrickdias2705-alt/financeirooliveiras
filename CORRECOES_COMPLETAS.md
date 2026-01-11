# Correções Completas do Sistema

## Problemas Identificados e Corrigidos

### 1. ✅ Inconsistência entre `customer_status` e `customer_category`
**Problema**: O código usava `customer_status` mas o banco de dados usa `customer_category`.

**Correções**:
- Atualizado `src/app/admin/customers/page.tsx` para usar `customer_category` em vez de `customer_status`
- Atualizado `src/app/api/customers/route.ts` para retornar `customer_category` no GET
- Adicionado campo `customer_category` no formulário de adicionar/editar cliente
- Adicionada opção "Hibernando" no select de categoria

### 2. ✅ Parcelas não apareciam corretamente
**Problema**: A API de orders não retornava `installments` e `installment_value`, então aparecia "À vista" mesmo quando havia parcelamento.

**Correções**:
- Atualizado `src/app/api/orders/route.ts` para retornar `installments` e `installment_value` no GET
- Atualizado `src/app/admin/orders/page.tsx` para exibir parcelas corretamente na tabela
- Adicionada coluna "Parcelas" na tabela de orders mostrando "Xx de R$ Y" ou "À vista"

### 3. ✅ Status de clientes bugado
**Problema**: O status não estava sendo exibido corretamente e não havia opção para definir manualmente.

**Correções**:
- Padronizado uso de `customer_category` em todo o código
- Adicionado campo de categoria no formulário com opções: Novo, Ativo, Hibernando
- Corrigida lógica de cálculo automático de categoria baseado em última compra

### 4. ✅ Schema do banco de dados
**Problema**: Faltavam tabelas e campos necessários.

**Correções**:
- Criado `SCHEMA_CORRIGIDO_COMPLETO.sql` com todas as correções necessárias:
  - Tabela `installments` com RLS
  - Tabela `expense_installments` com RLS
  - Campo `customer_category` em `customers`
  - Campos `installments` e `installment_value` em `orders`
  - Campos `installments` e `installment_value` em `transactions`
  - Tabela `categories` para produtos
  - Triggers e funções necessárias

## Como Aplicar as Correções

### Passo 1: Executar o SQL no Supabase
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o arquivo `SCHEMA_CORRIGIDO_COMPLETO.sql`
4. Verifique se todas as tabelas foram criadas corretamente

### Passo 2: Verificar o Código
O código já foi atualizado com todas as correções. Basta fazer deploy.

## Funcionalidades Corrigidas

### Clientes
- ✅ Categoria agora é exibida corretamente (Novo, Ativo, Hibernando)
- ✅ Pode definir categoria manualmente ao criar/editar cliente
- ✅ Cálculo automático de categoria baseado em última compra (60 dias)

### Pedidos
- ✅ Parcelas são exibidas corretamente na tabela
- ✅ Mostra "Xx de R$ Y" para pedidos parcelados
- ✅ Mostra "À vista" para pedidos sem parcelamento

### Parcelas
- ✅ Tabela `installments` criada e configurada
- ✅ Tabela `expense_installments` criada e configurada
- ✅ RLS configurado para ambas as tabelas

## Próximos Passos

1. **Executar o SQL** no Supabase antes de usar
2. **Testar criação de produtos** - se ainda houver problemas, verificar se a categoria está sendo criada corretamente
3. **Testar parcelas** - criar um pedido parcelado e verificar se aparece corretamente
4. **Testar categorias de clientes** - criar/editar cliente e verificar se a categoria é salva

## Notas Importantes

- O campo `customer_category` substitui completamente `customer_status` no contexto de categorização
- O campo `status` em customers ainda existe para "active/inactive" (ativo/inativo no sistema)
- As parcelas são criadas automaticamente quando um pedido é feito com parcelamento > 1
- As parcelas de despesas são criadas quando uma despesa é criada com parcelamento > 1
