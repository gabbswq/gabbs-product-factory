# Agent System Repo Map

Este documento registra os repositórios usados como referência para evoluir o workspace multi-agente.

## Objetivo

Construir um ambiente onde o usuário atua como maestro:

1. agentes implementam em worktrees separados;
2. builds/testes validam mudanças;
3. Claude API com cache revisa diffs;
4. usuário aprova merges;
5. GitHub mantém checkpoint limpo.

## Repositórios de Referência

### Codex + Claude Code

- https://github.com/openai/codex-plugin-cc
- https://github.com/skills-directory/skill-codex

Uso futuro:
- permitir que Claude Code delegue tarefas/reviews para Codex;
- criar fluxo Claude ↔ Codex quando a conta/API Claude estiver pronta.

Status:
- não instalar agora;
- primeiro estabilizar revisão via Claude API econômica.

### Planejamento e execução

- https://github.com/gsd-build/get-shit-done
- https://github.com/obra/superpowers

Uso futuro:
- extrair padrões de planejamento;
- criar comandos/skills locais;
- melhorar TASKS.md, HANDOFF.md e fluxo lead → agentes.

Status:
- usar como referência;
- não copiar código diretamente.

### Memória persistente

- https://github.com/thedotmack/claude-mem

Uso futuro:
- estudar hooks;
- estudar worker local;
- estudar memória persistente;
- estudar busca em camadas para reduzir tokens.

Status:
- não instalar inteiro agora;
- começar com uma versão simples baseada em docs, handoffs e reviews.

### Automação/MCP

- https://github.com/czlonkowski/n8n-mcp

Uso futuro:
- conectar agentes com automações n8n;
- criar workflows externos depois que o core estiver estável.

Status:
- fase posterior.

### Knowledge base e UI

- https://github.com/kepano/obsidian-skills
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/hesreallyhim/awesome-claude-code

Uso futuro:
- Obsidian como base de conhecimento;
- skill de revisão UI/UX;
- catálogo de novas ferramentas.

Status:
- referência, não instalação imediata.

## Decisão Atual

Prioridade atual:

1. manter Codex + tmux + OpenSessions como executor principal;
2. criar Claude API Review Agent com prompt caching;
3. usar estes repositórios como biblioteca de arquitetura;
4. só instalar plugins específicos quando houver necessidade clara.

