# TASKS.md

Plano de execucao para agentes trabalhando em paralelo neste projeto.

## Contexto Atual

- O repositorio mistura uma landing estatica na raiz (`index.html`, `styles.css`, `script.js`) com uma base Next.js em `src/`.
- A aplicacao Next usa App Router, Supabase SSR/client, auth por Supabase, listagem/detalhe de artigos, Stripe webhooks, provisionamento Discord e migracoes SQL.
- Nao ha `package.json`, `tsconfig.json`, `next.config.*`, `tailwind.config.*`, `middleware.ts`, `src/app/layout.tsx` ou componentes `src/components/ui/*` versionados no inventario atual.
- As rotas de auth usam `AuthProvider`, mas ainda precisa existir um provider no layout raiz.
- O hook `useAuth` chama `/api/auth/sync-provider`, mas nao existe route handler correspondente no inventario atual.
- O login redireciona para `/dashboard`, mas nao existe dashboard no inventario atual.
- As migracoes de payments usam `CHECK` com subquery em `prices_interval_matches_product`, o que nao e aceito por PostgreSQL em constraints `CHECK`; precisa ser redesenhado antes de aplicar o schema.

## Regras para Todos os Agentes

- Ler `AGENTS.md`, `CLAUDE.md` e os arquivos diretamente afetados antes de editar.
- Rodar `git status --short` antes de mudancas grandes.
- Nao editar `.env`, tokens, chaves, secrets ou credenciais.
- Fazer mudancas pequenas, revisaveis e com escopo claro.
- Nao apagar arquivos grandes ou diretorios sem confirmacao.
- Depois de alterar codigo, rodar o menor comando de validacao disponivel para o escopo.
- Registrar no final: arquivos alterados, comandos rodados e riscos pendentes.

## Ordem Recomendada

1. Estabilizar o scaffold Next.js e dependencias.
2. Validar e corrigir o schema Supabase.
3. Conectar fluxos backend ausentes.
4. Evoluir frontend publico e area autenticada.
5. Adicionar testes e verificacoes por area.

## Frontend

### FE-01: Auditar scaffold Next.js

Responsavel: agente frontend.

Escopo:
- Verificar se o projeto deve manter a landing estatica da raiz ou migrar tudo para Next.js.
- Inventariar arquivos ausentes necessarios para build: `package.json`, `tsconfig.json`, `next.config.*`, `src/app/layout.tsx`, estilos globais e aliases.
- Nao implementar ainda componentes de produto.

Entregavel:
- Documento curto ou secao em PR descrevendo a decisao de scaffold e arquivos minimos necessarios.

Depende de:
- Nenhuma.

### FE-02: Criar base visual e componentes UI minimos

Responsavel: agente frontend.

Escopo:
- Criar os componentes importados por paginas existentes: `Button`, `Input`, `Card`, `Form` e variantes usadas.
- Definir `globals.css` e tokens Tailwind compatíveis com classes ja usadas (`bg-background`, `text-muted-foreground`, `border`, `primary`, `destructive`, `prose`, `line-clamp`).
- Garantir que os componentes aceitem `asChild`, `variant`, `size` e `className` onde o codigo ja depende disso.

Entregavel:
- Paginas existentes compilando sem imports quebrados de `@/components/ui/*`.

Depende de:
- FE-01.

### FE-03: Criar layout raiz e providers

Responsavel: agente frontend.

Escopo:
- Criar `src/app/layout.tsx` com metadata base, idioma `pt-BR`, estilos globais e `AuthProvider`.
- Avaliar se `AuthProvider` deve ficar em componente separado client-side para preservar Server Components.
- Garantir que paginas de auth consigam usar `useAuth`.

Entregavel:
- Rotas `/`, `/articles`, `/auth/login`, `/auth/signup`, `/auth/forgot`, `/auth/reset` renderizam no navegador.

Depende de:
- FE-02.

### FE-04: Ajustar fluxo publico de artigos

Responsavel: agente frontend.

Escopo:
- Revisar `src/app/articles/page.tsx`, `src/app/articles/[slug]/page.tsx`, `ArticleCard`, `AuthorCard`, `ShareButtons` e `TagBadge`.
- Corrigir uso de APIs client/server quando necessario.
- Remover uso de `window` de Server Components se houver alternativa mais segura.
- Tratar estados vazios, loading e erro sem quebrar layout mobile.

Entregavel:
- Listagem e detalhe de artigos funcionando com dados Supabase publicados.

Depende de:
- FE-03.
- DB-03.

### FE-05: Completar fluxo de autenticacao

Responsavel: agente frontend.

Escopo:
- Revisar login, signup, forgot e reset.
- Criar paginas ausentes do fluxo se forem necessarias: `/auth/callback` e tela pos-login.
- Corrigir redirecionamento atual para `/dashboard` caso a rota ainda nao exista.
- Garantir mensagens em portugues e sem vazamento de existencia de email.

Entregavel:
- Fluxos de email/senha e OAuth retornam para rotas existentes.

Depende de:
- FE-03.
- BE-01.

### FE-06: Criar dashboard minimo autenticado

Responsavel: agente frontend.

Escopo:
- Criar rota protegida inicial para usuario logado.
- Usar `useRequireAuth` ou equivalente.
- Exibir dados basicos do perfil e links para artigos/produtos quando existirem.

Entregavel:
- `/dashboard` existe e nao redireciona usuarios autenticados para uma pagina ausente.

Depende de:
- FE-05.

### FE-07: Decidir destino da landing estatica

Responsavel: agente frontend.

Escopo:
- Comparar conteudo/identidade da landing estatica `VOID CRYPT` com a landing Next `InnovateTech`.
- Propor uma fonte de verdade: manter raiz estatica, migrar conteudo para Next, ou arquivar apos confirmacao.
- Nao apagar arquivos sem confirmacao.

Entregavel:
- Decisao registrada e, se aprovado, plano de migracao separado.

Depende de:
- FE-01.

## Backend

### BE-01: Implementar callback e sync de OAuth

Responsavel: agente backend.

Escopo:
- Criar route handler para callback Supabase OAuth/email conforme o fluxo usado pelo app.
- Criar endpoint `/api/auth/sync-provider` chamado por `useAuth`.
- Validar JWT do usuario antes de gravar `auth_providers`.
- Usar service role apenas server-side.

Entregavel:
- Sign-in OAuth nao chama rota inexistente e persiste provider sem expor secrets.

Depende de:
- DB-01.

### BE-02: Criar checkout Edge Function

Responsavel: agente backend.

Escopo:
- Implementar funcao server-side para abrir Stripe Checkout Session.
- Criar `orders` com status `pending` usando service role.
- Preencher `client_reference_id`, `metadata.supabase_user_id`, `stripe_session_id`, `price_id` e URLs de sucesso/cancelamento.
- Nao marcar pedido como pago no retorno do cliente.

Entregavel:
- Checkout inicia com pedido pendente e webhook consegue reconciliar o pedido.

Depende de:
- DB-04.

### BE-03: Validar `stripe-webhook`

Responsavel: agente backend.

Escopo:
- Revisar eventos suportados e compatibilidade com a versao Stripe usada.
- Garantir idempotencia para `payments`, `orders` e `subscriptions`.
- Verificar tratamentos de checkout de assinatura e compra unica.
- Adicionar logs estruturados suficientes para operacao.

Entregavel:
- Webhook com caminho de sucesso documentado e casos de retry conhecidos.

Depende de:
- BE-02.
- DB-04.

### BE-04: Endpoints de produtos e acesso

Responsavel: agente backend.

Escopo:
- Definir como frontend consulta produtos, precos e acesso.
- Expor helpers server-side para `can_access_product`.
- Evitar queries client-side que vazem dados financeiros alem do necessario.

Entregavel:
- Contrato simples para listar produtos ativos e consultar acesso do usuario.

Depende de:
- DB-04.

### BE-05: Agendamento de publicacao de artigos

Responsavel: agente backend.

Escopo:
- Definir executor: `pg_cron`, Supabase Scheduled Function ou chamada operacional.
- Chamar `publish_scheduled_articles()` e `refresh_featured_articles()` como comandos separados.
- Registrar observabilidade minima do numero de artigos publicados.

Entregavel:
- Artigos agendados passam para publicados sem acao manual.

Depende de:
- DB-03.

### BE-06: Provisionamento Discord com retry operacional

Responsavel: agente backend.

Escopo:
- Revisar `provision-discord` para chamadas internas autenticadas.
- Planejar retry quando usuario ainda nao vinculou Discord.
- Definir onde armazenar pendencias de role caso seja necessario.

Entregavel:
- Falha por Discord nao vinculado nao perde definitivamente o acesso comprado.

Depende de:
- DB-02.
- DB-04.

## Database

### DB-01: Validar migracoes em ambiente limpo

Responsavel: agente database.

Escopo:
- Rodar as migracoes Supabase em banco limpo/local.
- Registrar erros de SQL, ordem de dependencias e extensoes exigidas.
- Nao alterar dados reais.

Entregavel:
- Lista objetiva de migracoes que aplicam e falham, com mensagens de erro.

Depende de:
- Nenhuma.

### DB-02: Corrigir schema de auth e providers

Responsavel: agente database.

Escopo:
- Revisar `public.users`, `auth_providers`, triggers e RLS.
- Garantir que public views nao dependam de RLS que bloqueia anon indevidamente.
- Validar fluxo para provider `google` e futuro provider `discord`.

Entregavel:
- Auth schema aplicavel e coerente com BE-01.

Depende de:
- DB-01.

### DB-03: Corrigir schema de conteudo e views

Responsavel: agente database.

Escopo:
- Validar `articles`, `tags`, `article_tags`, `article_assets`, `authors`, `public_articles`, `featured_articles`.
- Confirmar se views `authors` e `featured_articles` conseguem ler autores publicamente sem expor email.
- Garantir refresh da materialized view e indices necessarios.
- Criar seed minimo opcional para testar listagem publica.

Entregavel:
- Queries usadas por `/` e `/articles` retornam dados para anon quando ha artigo publicado.

Depende de:
- DB-02.

### DB-04: Corrigir schema de payments

Responsavel: agente database.

Escopo:
- Remover ou substituir a constraint `prices_interval_matches_product`, pois `CHECK` com subquery nao e valido em PostgreSQL.
- Validar constraints, indices e RLS de `products`, `prices`, `orders`, `subscriptions`, `payments`, `stripe_customers`.
- Confirmar funcoes `has_active_subscription`, `has_purchased` e `can_access_product`.

Entregavel:
- Payments schema aplicavel em banco limpo e coerente com BE-02/BE-03.

Depende de:
- DB-02.

### DB-05: Definir estrategia de storage para assets

Responsavel: agente database.

Escopo:
- Criar ou documentar bucket Supabase para `article-assets`.
- Definir politicas de leitura publica/privada para imagens de artigos.
- Alinhar `article_assets.storage_path` com uso de `cover_url` e markdown.

Entregavel:
- Caminho claro para upload e leitura de imagens sem URLs quebradas.

Depende de:
- DB-03.

### DB-06: Criar matriz de permissoes RLS

Responsavel: agente database.

Escopo:
- Tabelar permissoes para `anon`, `authenticated`, `author`, `admin` e `service_role`.
- Cobrir auth, content e payments.
- Incluir consultas de smoke test para cada papel quando possivel.

Entregavel:
- Matriz revisavel para agentes frontend/backend saberem o que podem consultar direto.

Depende de:
- DB-02.
- DB-03.
- DB-04.

## Tarefas de Integracao

### INT-01: Criar comandos de validacao do projeto

Responsavel: agente integracao.

Escopo:
- Definir scripts para lint, typecheck, build e format.
- Documentar comandos em README ou package scripts.
- Garantir que agentes saibam qual comando rodar por escopo.

Entregavel:
- `npm run lint`, `npm run typecheck` e `npm run build` ou equivalentes documentados.

Depende de:
- FE-01.

### INT-02: Testes de smoke end-to-end

Responsavel: agente integracao.

Escopo:
- Criar roteiro de smoke para home, artigos, auth, dashboard e checkout.
- Automatizar apenas depois que scaffold e rotas existirem.
- Usar dados fake/local, sem secrets reais.

Entregavel:
- Smoke test reproduzivel localmente.

Depende de:
- FE-06.
- BE-02.
- DB-04.

### INT-03: Documentar setup local

Responsavel: agente integracao.

Escopo:
- Documentar instalacao, Supabase local, migracoes, variaveis esperadas sem valores reais e comandos de desenvolvimento.
- Separar claramente secrets obrigatorios de opcionais.

Entregavel:
- README de setup suficiente para novo agente rodar o projeto.

Depende de:
- INT-01.
- DB-01.

## Paralelizacao Sugerida

- Rodada 1: FE-01, DB-01 e BE-01 podem comecar em paralelo, desde que BE-01 limite mudancas ao contrato e aguarde DB-02 para validar gravacoes.
- Rodada 2: FE-02/FE-03, DB-02/DB-03 e BE-02 podem seguir em paralelo com ownership separado.
- Rodada 3: FE-04/FE-05/FE-06, DB-04/DB-05 e BE-03/BE-04/BE-05 podem rodar em paralelo.
- Rodada 4: INT-01, INT-02 e INT-03 consolidam validacao e documentacao.

## Ownership por Arquivos

- Frontend: `src/app/**`, `src/components/**`, `src/hooks/**`, `src/types/**`, estilos e configuracao Next/Tailwind.
- Backend: `src/app/api/**`, `supabase/functions/**`, contratos server-side de auth/checkout/webhooks.
- Database: `supabase/migrations/**`, seeds locais, scripts SQL e documentacao de RLS/storage.
- Integracao: `package.json`, configs de build/test, README e testes de smoke.

Agentes em paralelo devem evitar editar o mesmo arquivo. Se isso for inevitavel, combinar antes o dono primario do arquivo.
