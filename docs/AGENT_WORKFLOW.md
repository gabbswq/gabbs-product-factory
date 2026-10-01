# Trabalho assistido no Millennium

Leia [AGENTS.md](../AGENTS.md), a [SPEC vigente](MILLENNIUM_SPEC.md) e a [passagem de turno](HANDOFF_MILLENNIUM.md). Confirme os arquivos e o estado do Git antes de confiar em um relato anterior.

## Fluxo atual

Objetivo → plano curto → execução autorizada → teste → revisão → aprendizado → passagem de turno.

O responsável humano coordena as etapas. Papéis em worktrees diferentes não conversam automaticamente entre si. Comece com um executor; especialize o trabalho apenas quando necessário.

## Abrir uma tarefa

Registre objetivo, escopo, resultado esperado e teste de aceite. Confira `git status` e preserve alterações anteriores. Se o pedido for apenas uma conversa ou planejamento, não transforme a proposta em implementação sem alinhamento.

Lead delimita e revisa; frontend cuida da interface; backend cuida de APIs e regras; database cuida de dados. A definição de cada tarefa, não o nome do papel, determina os arquivos autorizados.

## Executar e revisar

Use tarefas pequenas e verificáveis. Não coloque dois agentes escrevendo na mesma pasta. A revisão considera o pedido, o diff e os resultados de teste, além da resposta do executor.

Na mesma conversa, envie apenas a próxima instrução e os achados relevantes. Exportar o TXT é uma opção para auditoria externa, não uma etapa obrigatória de toda alteração. A exportação completa continua disponível como evidência; um resumo não deve ser apresentado como log integral.

Ao encontrar um problema, confirme no código, corrija dentro do escopo e execute o teste pertinente. Um teste verde não demonstra requisitos que ele não cobre. Os estados persistidos, cancelamento integrado e rodadas automáticas da SPEC são trabalho futuro, não capacidades deste procedimento manual.

## Encerrar o turno

Atualize `docs/HANDOFF_MILLENNIUM.md` com:

1. Objetivo e resultado desta sessão.
2. Arquivos alterados e mudanças preexistentes que devem ser preservadas.
3. Comandos executados, resultados e referências às evidências.
4. Anomalias, riscos e o que não foi verificado.
5. Um conceito explicado e uma pequena verificação para o usuário.
6. Primeira ação concreta do próximo turno.

Preserve referências úteis da passagem anterior. Não inclua chaves, dados privados do empregador, conversas integrais nem informações pessoais desnecessárias num documento destinado ao repositório público.

## Versionamento

Inspecione o diff antes de selecionar arquivos. Commits devem ser coerentes e revisáveis; não agrupe trabalho alheio por conveniência. Commit, merge, push e deploy dependem da autorização do usuário para a ação correspondente, não acontecem automaticamente no fechamento.

Nunca versione `.env`, chaves, tokens, registros privados de conversas, `node_modules`, `.next`, `.venv` ou `__pycache__`. Não use reset ou recriação de worktrees para descartar problemas de contexto.

## Retomada

Leia a passagem de turno e confirme o estado atual. Proponha a próxima tarefa sem reexecutar automaticamente ações registradas no histórico. Os [snapshots antigos](history/previous-product-direction/README.md) documentam outra direção e não substituem a SPEC vigente.
