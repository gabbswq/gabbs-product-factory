# Claude API Cache Plan

## Objetivo

Usar Claude API de forma econômica para revisão e arquitetura, sem substituir os agentes Codex principais.

## Contexto cacheável

- AGENTS.md
- CLAUDE.md
- TASKS.md
- docs/agent-system/*
- schema Supabase
- regras de segurança
- arquitetura do projeto

## Contexto variável

- git diff atual
- erro de build
- tarefa específica
- arquivos alterados

## Uso inicial

Criar um script:

scripts/claude-review-diff.py

Função:
- ler contexto fixo;
- aplicar prompt caching;
- ler git diff;
- pedir revisão objetiva;
- salvar relatório em docs/reviews/.

## Regras

- Nunca colocar API key no código.
- Usar ANTHROPIC_API_KEY no ambiente.
- Nunca enviar .env.
- Nunca enviar node_modules, .next ou build artifacts.
- Usar como revisor, não como executor principal.
