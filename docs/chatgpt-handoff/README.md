# Gabbs Product Factory — Handoff para ChatGPT

Esta pasta existe para que um chat novo do ChatGPT consiga assumir a "Sala de Controle" do projeto sem precisar reconstruir contexto na unha.

## Estrutura

- `README.md` — este arquivo. Mapa da pasta.
- `CURRENT_STATE.md` — estado atual do produto, dos agentes e das dívidas técnicas.
- `OPERATING_PROTOCOL.md` — como Sala de Controle, agentes e Gabriel se relacionam.
- `NEW_CHAT_PROMPT.md` — prompt pronto para colar num chat novo do ChatGPT.

## Identidade do projeto

- Nome: **Gabbs Product Factory**
- GitHub: https://github.com/gabbswq/gabbs-product-factory
- Repositório local principal: `~/ai-projects/gabbs-product-factory`
- Ambiente: WSL/Ubuntu sobre Windows

## Stack resumida

Next.js 15, React, TypeScript, Supabase (Auth + Edge Functions), Stripe, GitHub. Operação em tmux com Git worktrees, Claude Code e Codex.

## Worktrees

- Lead: `~/ai-projects/gabbs-product-factory` (a pasta principal — lead **não** roda em worktree própria).
- Frontend: `~/ai-projects/worktrees/gabbs-product-factory/frontend`
- Backend: `~/ai-projects/worktrees/gabbs-product-factory/backend`
- Database: `~/ai-projects/worktrees/gabbs-product-factory/database`

## Como usar esta pasta num chat novo

1. Abrir chat novo no ChatGPT.
2. Colar o conteúdo de `NEW_CHAT_PROMPT.md`.
3. Seguir o que o chat pedir (ele vai pedir para rodar alguns comandos de leitura).
4. A partir daí, o chat passa a operar como Sala de Controle.

## O que esta pasta **não** é

- Não é documentação completa do produto (isso vive em `docs/PRODUCT_BRIEF.md`, `docs/ROADMAP.md` etc.).
- Não é changelog.
- Não é registro histórico de decisões. É um snapshot de passagem de turno.
