# Database Migration Validation

Data: 2026-05-01

Escopo: DB-01, validar as migracoes Supabase em ambiente limpo/local e registrar falhas de SQL, ordem de dependencias e extensoes exigidas.

## Resultado

Nao foi possivel executar as migracoes contra um banco limpo neste ambiente porque as ferramentas locais necessarias nao estao disponiveis:

- `docker`: nao instalado.
- `psql`: nao instalado.
- `supabase`: nao instalado localmente.
- `npx supabase --version`: tentou buscar o pacote no npm, mas falhou por rede/DNS com `EAI_AGAIN registry.npmjs.org`.

Nenhum banco real foi usado. Nenhuma credencial real foi usada. Nenhum arquivo em `supabase/migrations/**` foi alterado.

## Migracoes analisadas

Ordem analisada:

1. `supabase/migrations/20260402000000_auth_schema.sql`
2. `supabase/migrations/20260402000001_auth_rls.sql`
3. `supabase/migrations/20260403000000_content_schema.sql`
4. `supabase/migrations/20260403000001_articles_rls.sql`
5. `supabase/migrations/20260403000002_publish_scheduled_articles.sql`
6. `supabase/migrations/20260403000003_payments_schema.sql`
7. `supabase/migrations/20260403000004_payments_rls.sql`

## Aplicacao em banco limpo

Como nao havia Supabase CLI, Docker ou `psql`, nenhuma migracao pode ser marcada como "passou" por execucao real.

| Migracao | Status de execucao | Observacoes |
| --- | --- | --- |
| `20260402000000_auth_schema.sql` | Nao executada | Depende do schema Supabase `auth.users` e de `gen_random_uuid()` disponivel no ambiente Supabase/Postgres. |
| `20260402000001_auth_rls.sql` | Nao executada | Depende das tabelas de auth criadas pela migracao anterior e dos roles Supabase `anon` e `authenticated`. |
| `20260403000000_content_schema.sql` | Nao executada | Exige extensao `unaccent`; depende de `public.users` e `public.set_updated_at()`. |
| `20260403000001_articles_rls.sql` | Nao executada | Depende de `public.is_admin()` e das tabelas/views de conteudo. |
| `20260403000002_publish_scheduled_articles.sql` | Nao executada | Depende de `public.articles`. |
| `20260403000003_payments_schema.sql` | Nao executada | Contem uma falha SQL estatica em uma constraint `CHECK`; ver achado DB-01-A1. |
| `20260403000004_payments_rls.sql` | Nao executada | Depende das tabelas de payments; nao deve aplicar enquanto `20260403000003_payments_schema.sql` falhar. |

## Achados

### DB-01-A1: `prices_interval_matches_product` usa subquery dentro de `CHECK`

Arquivo: `supabase/migrations/20260403000003_payments_schema.sql`

Trecho relevante:

```sql
CONSTRAINT prices_interval_matches_product
  CHECK (
    (interval IS NULL) OR
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.access_type = 'subscription'
    )
  )
```

Risco/erro esperado: PostgreSQL nao permite subqueries em constraints `CHECK`. Em um banco limpo, a criacao da tabela `public.prices` deve falhar nesta constraint.

Mensagem esperada em PostgreSQL:

```text
ERROR: cannot use subquery in check constraint
```

Impacto: a cadeia de migracoes deve parar em `20260403000003_payments_schema.sql`; `20260403000004_payments_rls.sql` nao deve aplicar depois disso.

## Dependencias e requisitos observados

- Ambiente Supabase/Postgres com schema `auth` e tabela `auth.users`.
- Roles Supabase `anon` e `authenticated`.
- Funcao `auth.uid()`.
- Funcao `gen_random_uuid()`.
- Extensao `unaccent`, criada por `20260403000000_content_schema.sql`.
- Suporte a views com `security_invoker = true`.

## Passos recomendados

1. Rodar novamente em ambiente com Docker/Supabase CLI ou `psql` local disponivel.
2. Corrigir `prices_interval_matches_product` em DB-04 antes de considerar o schema de payments aplicavel.
3. Depois da correcao, executar a cadeia completa em banco limpo e substituir os status "Nao executada" por "Passou" ou "Falhou" com a mensagem real do banco.
