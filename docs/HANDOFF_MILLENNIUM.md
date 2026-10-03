# Passagem de turno: Millennium

Registro de 1 de outubro de 2026. Revalidar antes de continuar.

## Continuidade em 3 de outubro de 2026

O foco escolhido foi o executor local do turno, não o gateway. A implementação
em `feature/turno-local`, destinada apenas a `develop`, fica em
`C:\Users\gabbs\Documents\ChatGPT\M\millennium` (WSL:
`/mnt/c/Users/gabbs/Documents/ChatGPT/M/millennium`). O checkout pessoal
`~/ai-projects/gabbs-product-factory` permanece separado, com suas alterações
anteriores preservadas. Não troque/reset essa pasta para pegar o incremento.

Comece por [TURNO_LOCAL.md](TURNO_LOCAL.md) e **Millennium: diagnostico do turno**
no VS Code conectado ao WSL. O executor descobre Codex no PATH ou em
`~/.local/bin`; isso corrige a entrada ausente em terminais não-login.

Os primeiros ensaios passaram, mas suas pastas em `/tmp` já não estão
disponíveis; não dependemos delas como evidência atual. O novo ensaio real em
`.millennium/live-tOAFD7/` completou plano, implementação, cinco testes de
validação de anomalia fictícia, revisão somente leitura e fechamento. Os
registros persistem dentro desta cópia privada, fora do Git. Não gerou aceite
humano: `accepted_evidence` permanece nulo e a tarefa fica em revisão.

A suite automatizada passou com 32 testes, sem inferência. Cobre branch,
locks, cancelamento (inclusive filho resistente ao SIGTERM), recuperação,
evidências e aceite. O diagnóstico real encontrou Node 20.20.2 e Codex CLI
0.158.0 autenticado no Ubuntu. Uma revisão independente do executor não
encontrou achados bloqueadores, mas não rodou a suite em seu sandbox somente
leitura; a execução dos testes foi feita separadamente.

Este é um incremento técnico, não usabilidade aprovada. Próxima sessão:
Gabriel abrir a develop isolada no VS Code, preparar uma feature, executar uma
tarefa pequena e explicar uma mudança/teste. Registrar dificuldades reais
antes de adicionar chat web, banco, mais agentes ou pagamentos.

QA em preview, tags e produção em main não foram solicitados neste turno.
O conteúdo abaixo preserva o histórico e as referências da transição anterior.

## Objetivo e decisão

Gabriel confirmou **Millennium** como marca. O produto é uma fábrica pessoal de software assistida por IA, com turnos, execução, revisão, aprendizado e passagem de serviço. A experiência futura usa conversa e prévia como referências; a aplicação de pagamentos é uma iniciativa posterior, separada.

## O que foi preparado

- SPEC com requisitos, contrato de execução, arquitetura proposta e critérios de aceite.
- Primeiro turno no VS Code e alinhamento de brief, roadmap e guias.
- Nome Millennium na landing local, metadados do experimento, títulos de workspaces e extensão privada 0.1.3.
- Iniciador local `C:\dev\Abrir Millennium.cmd` e guia `C:\dev\fabrica\COMECE-AQUI.md`.
- Backups dos arquivos anteriores, sem descarte de alterações existentes.
- Publicação autorizada em [gabbswq/millennium](https://github.com/gabbswq/millennium) e [landing Millennium](https://gabbswq.github.io/millennium/).

## Publicação verificada

O commit `c4e78546bc1d53c44066d3cca65d117d6235b7ed` publicou a direção e a marca. O [workflow de qualidade e deploy](https://github.com/gabbswq/millennium/actions/runs/36852399589) concluiu com sucesso. A página pública foi aberta em 1440, 390 e 320 pixels, com título Millennium, links para o novo repositório, assets carregados e sem erros de JavaScript ou overflow horizontal detectado.

O estado remoto anterior está preservado na branch `backup/pre-millennium-20261001`, no commit `8d16366b1c95c7f41ecc0e43a5340cae09c41338`. Os arquivos de código de segurança, webhook e alterações de dependências que já estavam em andamento não entraram na publicação. O endereço público antigo da landing não deve ser usado como entrada atual.

## Evidências técnicas desta transição

- `npm --prefix landing run verify`: build, 14 testes Playwright e limite de bundle passaram.
- `node --test /mnt/c/dev/fabrica/vscode-extension/tests/*.test.cjs`: 10 testes passaram.
- `C:\dev\fabrica\tests\Test-Setup.ps1`: quatro workspaces e 24 combinações de papel/modo verificadas sem iniciar IA.
- `npm run typecheck`: passou na aplicação experimental.
- Capturas locais em 1440, 360 e 320 pixels, sem overflow horizontal detectado.
- Extensão 0.1.3 confirmada no VS Code Windows e no servidor WSL; isso não comprova que uma janela antiga foi recarregada.

Os registros e backups desta transição ficam no diretório local `millennium-transition` do chat de trabalho. Eles não devem ser publicados integralmente como documentação do produto.

## Pendências registradas em 1 de outubro

- Uma sessão em que Gabriel execute, confira e retome uma tarefa sozinho.
- Interface própria de conversa e prévia, executor persistente e coordenação automática.
- Medição comparativa de tokens/custo e acesso pelo celular.
- Operação real de pagamentos.

Não considerar o projeto inteiro pronto com base nos testes acima.

## Preservar ao continuar

O checkout principal já tinha alterações em README, `index.html`, workflows, dependências, webhook e uma SPEC de segurança. A cópia de trabalho em `C:\dev\fabrica\web` também tem alterações próprias. Não publicar tudo junto, sobrescrever uma pela outra, resetar ou mover pastas sem verificar as referências.

Os caminhos `gabbs-product-factory` e `C:\dev\fabrica` e os IDs internos `fabrica.*` permanecem por compatibilidade. O nome exibido é Millennium. Snapshots históricos não devem ser usados como roteiro atual.

## Próxima ação da transição de 1 de outubro

Abrir `Abrir Millennium.cmd`, conferir o título Millennium/lead e o contexto Ubuntu, e seguir [PRIMEIRO_TURNO.md](PRIMEIRO_TURNO.md) com Gabriel. Começar por uma proposta pequena do exercício Diário de Turno, com dados fictícios; não construir o aplicativo inteiro antes de observar o primeiro uso.

Durante a sessão, ensinar a diferença entre arquivo, alteração (diff) e commit. Pedir que Gabriel encontre um arquivo alterado e explique uma mudança. Registrar aqui o resultado real e a próxima ação, sem marcar os critérios de usabilidade como aprovados antecipadamente.
