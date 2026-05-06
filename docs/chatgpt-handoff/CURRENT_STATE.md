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
