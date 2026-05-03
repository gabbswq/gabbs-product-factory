# Agent Workflow

This document defines how AI agents should work inside Gabbs Product Factory.

## Main rule

Agents do not implement before planning.

Every task follows this sequence:

plan -> approval -> implementation -> validation -> commit -> merge -> build -> push

## Agent roles

- lead: plans the work and coordinates the system
- frontend: works on UI, pages and user experience
- backend: works on APIs, auth, payments and Edge Functions
- database: works on schema, migrations, RLS and SQL validation

## Standard prompt ending

Every agent request should end with:

No final, gere uma seção chamada BLOCO PARA CHATGPT, com no máximo 80 linhas, sem tabelas largas, contendo:
1. o que mudou;
2. arquivos alterados;
3. riscos;
4. validações;
5. se precisa de aprovação;
6. próximo passo recomendado.

## Task size

Prefer small tasks.

Good examples:

- fix one webhook issue
- create one endpoint
- validate one migration
- refactor one file

Bad examples:

- rebuild the whole backend
- redesign the whole app
- change frontend, backend and database at once

## Commit rule

One task equals one commit.

## Merge rule

Only merge into main after:

- git status --short
- git diff --stat
- task-specific validation
- build check when applicable

## Safety rule

Never commit:

- .env
- API keys
- secrets
- node_modules
- .next
- .venv
- __pycache__
