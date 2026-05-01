# Multi-Agent Orchestration Plan

## Estado atual

- WSL/Ubuntu configurado.
- GitHub conectado.
- OpenSessions funcionando.
- tmux com lead, frontend, backend e database.
- Git worktrees separados por agente.
- Codex CLI funcionando.
- Claude Code instalado, mas ainda sem conta/API operacional.
- Frontend passou build.
- Backend passou build.
- Database gerou relatório de validação.
- Projeto principal limpo e publicado no GitHub.

## Objetivo

Construir um workspace onde o usuário atua como maestro:

1. lead planeja;
2. frontend implementa UI;
3. backend implementa APIs/server/auth;
4. database valida migrations/RLS/schema;
5. revisor avalia diff antes do merge;
6. usuário aprova;
7. main recebe apenas mudanças verificadas.

## Próxima fase

Adicionar uma camada de revisão econômica usando Claude API com prompt caching.

Fluxo desejado:

1. agente implementa;
2. npm run build passa;
3. script coleta diff;
4. Claude API revisa usando contexto cacheado;
5. relatório é salvo;
6. usuário decide merge.
