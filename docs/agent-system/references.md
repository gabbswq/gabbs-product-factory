# Agent System References

Este documento registra referências externas analisadas para evoluir o workspace multi-agente.

## Claude-Mem

Ideias úteis:
- memória persistente entre sessões;
- lifecycle hooks para capturar eventos dos agentes;
- worker HTTP local;
- SQLite para histórico estruturado;
- Chroma/vector search para busca semântica;
- viewer local para visualizar memória;
- skill de busca;
- separação entre planning skill e execution skill;
- busca em camadas para economizar tokens.

Como isso encaixa no nosso setup:
- Codex continua executando tarefas nos worktrees.
- OpenSessions continua sendo o painel visual.
- Claude API com cache pode virar revisor econômico.
- Uma camada futura de memória pode registrar decisões, comandos, erros e handoffs.

## Get Shit Done / Superpowers / Everything Claude Code

Ideias a investigar:
- comandos de workflow;
- agentes especializados;
- templates de planejamento;
- prompts reutilizáveis;
- fluxo de execução por fases;
- padrões de verificação antes de merge.

## Regra

Não copiar código diretamente desses projetos para o app principal sem revisão.
Usar primeiro como referência arquitetural.
