# Estado Atual

Snapshot do projeto no momento desta passagem de turno.

## Repositório

- Repo renomeado para `gabbs-product-factory`.
- Repo público no GitHub: https://github.com/gabbswq/gabbs-product-factory
- Documentação inicial criada em `docs/`.
- Worktrees (frontend, backend, database) sincronizados.
- Build passou na última verificação.

## Tarefas concluídas

- **BE-02** — `create-checkout` (Edge Function).
- **BE-03** — `stripe-webhook` com reconciliação.
- **BE-04** — endpoints de produto/acesso.
- **FE-01** — página `/products` (listagem).

## Produto hoje

Endpoints disponíveis:

- `GET /api/products`
- `GET /api/products/[slug]`
- `GET /api/products/[id]/access`

Páginas no frontend:

- `/products` (listagem)

## Próxima tarefa

**FE-02 — criar `/products/[slug]`**

Objetivos:

- Corrigir o 404 atual no link do `ProductCard`.
- Mostrar detalhe público do produto: nome, descrição, tipo, acesso e preços.
- Exibir botão **Comprar** apenas visualmente.
- **Não** ligar checkout ainda se isso aumentar o escopo.

Agente responsável: **frontend** (worktree `~/ai-projects/worktrees/gabbs-product-factory/frontend`).

## Scripts operacionais em uso

- `agent-copy` — captura resposta grande do agente, salva em arquivo e copia para o clipboard. Funcionando.
- `agent-watch` — monitora agente no tmux. Funcionando.
- `win-notify` — toca som quando o agente precisa de atenção. Funcionando, mas com dívida técnica (ver abaixo).

## Fluxo de cópia de respostas longas

Quando um agente devolver texto grande, **não copiar com mouse nem Ctrl+C**. Rodar:

```
agent-copy frontend
agent-copy backend
agent-copy database
agent-copy lead
```

E colar no ChatGPT para revisão.

## Dívidas técnicas conhecidas

- **INFRA-01** — organizar pastas Windows/WSL.
- **INFRA-02** — normalizar `win-notify` e sons. O `iphone.wav` atual parece MP3/ADTS renomeado e está sendo tocado via Windows Media Player.

## O que **não** mexer sem decisão explícita

- Credenciais e `.env`.
- `package.json`.
- Migrations e schema do Supabase.
- Configuração da Stripe.

---

# Atualização de fechamento — 2026-05-06

Esta seção é a atualização mais recente e prevalece sobre o snapshot anterior neste arquivo.

## FE-02 concluída

- Status: concluída, commitada e publicada.
- Commit: 24aa99d9 feat(fe-02): add product detail page.
- Branch: main.
- origin/main sincronizada.
- Validações na main: npm run typecheck passou; npm run build passou.
- Rota criada: /products/[slug].

## Entrega da FE-02

- Corrigido o 404 ao clicar no ProductCard.
- Criada página pública de detalhe do produto.
- Exibe tipo, tipo de acesso, título, descrição e preços.
- Botão Comprar ficou apenas visual/desativado.
- Não houve integração de checkout.
- Não houve mudança em .env, package.json, migrations, Supabase ou Stripe.

## Estado dos worktrees no fechamento

- main: 24aa99d9.
- frontend: 24aa99d9.
- backend: 55f9c3c5, atrás da main.
- database: 55f9c3c5, atrás da main.
- Antes de usar backend ou database novamente, rodar git merge main --ff-only dentro do worktree respectivo.

## Notas operacionais aprendidas

- Em worktree, .git pode ser arquivo, não diretório. Para exclude local, usar git rev-parse --git-path info/exclude.
- Não usar git add . quando houver node_modules untracked.
- Se tmux mostrar "sessions should be nested with care", significa que já há uma sessão tmux ativa; não é erro do Claude.
- Para copiar no terminal Ubuntu, usar Ctrl+Shift+C. Ctrl+C interrompe comando.

## Próxima tarefa provável

- DOC-01: documentar visão multi-projeto e OpenSessions.
- A Gabbs Product Factory deve ser documentada como sistema operacional multiagente reutilizável, não apenas como este SaaS.
- Não abrir DOC-01 antes de rodar o handoff completo no próximo turno.

## Frente ativa agora

- Nenhuma feature ativa.
- Última frente fechada: FE-02.
- Próxima frente candidata: DOC-01.
