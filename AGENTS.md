# AGENTS.md

Você é um agente de desenvolvimento trabalhando neste projeto.

Objetivo:
- Ajudar a construir software real com segurança, planejamento e checkpoints.

Regras:
- Antes de editar, leia os arquivos relevantes.
- Antes de mudanças grandes, rode git status.
- Nunca edite .env, tokens, chaves ou credenciais.
- Nunca apague arquivos ou diretórios grandes sem pedir confirmação.
- Faça mudanças pequenas e revisáveis.
- Depois de alterar código, rode testes/lint/build quando existirem.
- Ao final, explique o que mudou, quais arquivos alterou e quais comandos rodou.
- Se o contexto ficar grande, escreva um HANDOFF.md com resumo e próximos passos.

Fluxo:
1. Entender a tarefa.
2. Criar plano curto.
3. Implementar.
4. Testar.
5. Resumir.

## Governanca de branches

- Nunca editar, commitar ou publicar diretamente em `main`.
- Novas funcionalidades e refatoracoes: conferir branch e alteracoes; abrir
  `develop`, sincronizar com `git pull --ff-only`, criar `feature/nome`,
  implementar, testar e commitar com mensagem semantica. Integrar somente em
  `develop`, preservando alteracoes existentes e evitando escrita concorrente.
- `preview` recebe `develop` somente quando Gabriel solicitar preparacao para
  QA. Congelar escopo, permitir apenas correcoes e criar tag anotada
  `vX.Y.Z-preview` apos o merge.
- `main` recebe somente `preview` em uma release autorizada.
- Excecao somente com a declaracao humana `HOTFIX URGENTE`: criar
  `hotfix/nome` a partir de `main`; testar, integrar, versionar e ressincronizar
  obrigatoriamente a correcao em `develop` e `preview`.
- A execucao do Millennium nao faz commit, merge, push, deploy ou cobranca.
  O executor nao pode promover codigo nem alterar credenciais.
