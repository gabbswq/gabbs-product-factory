# Claude API Cache Review Plan

## Objetivo

Criar um revisor econômico usando Claude API com prompt caching.

## Fluxo

1. Agente implementa em um worktree.
2. Build/typecheck passa.
3. `scripts/claude-review-diff.py` coleta contexto fixo, git status e git diff.
4. Claude revisa riscos.
5. Relatório é salvo em `docs/reviews/`.
6. Usuário decide se faz merge.

## Contexto fixo cacheável

- AGENTS.md
- CLAUDE.md
- TASKS.md
- docs/agent-system/*
- docs/database-migration-validation.md
- supabase/migrations/*.sql
- package.json
- tsconfig.json

## Contexto variável

- git diff atual
- branch atual
- status do git
- erro de build, quando houver
- tarefa que está sendo revisada

## Regras

- Nunca colocar API key no código.
- Usar `ANTHROPIC_API_KEY` no ambiente.
- Nunca enviar `.env`.
- Nunca enviar `node_modules`, `.next`, `dist` ou `build`.
- Usar Claude API como revisor, não como executor principal.
