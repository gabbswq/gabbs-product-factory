# Millennium: um turno executavel no VS Code

Incremento de desenvolvimento de 3 de outubro de 2026. A landing continua
separada; este fluxo roda no terminal Ubuntu/WSL, dentro de um projeto Git.
Nao e um gateway, um chat web ou uma plataforma pronta para terceiros.

## Abrir

Abra esta copia do repositorio no VS Code conectado ao **WSL: Ubuntu**.
O checkout pessoal antigo pode conter alteracoes e nao deve ser sobrescrito.
O incremento fica primeiro na `develop`, nunca diretamente na `main`.

Na maquina de Gabriel, abra **Arquivo > Abrir Pasta** na janela conectada ao
WSL e selecione `/mnt/c/Users/gabbs/Documents/ChatGPT/M/millennium`. Ou, no
terminal Ubuntu, use as duas linhas abaixo separadamente:

```sh
cd /mnt/c/Users/gabbs/Documents/ChatGPT/M/millennium
code .
```

Esses caminhos sao desta copia isolada. Em outra maquina, use a pasta onde
clonou `develop`. O atalho pessoal antigo ainda abre o checkout anterior;
nao o confunda com esta copia de desenvolvimento.

Requisitos: Node 20 ou superior, npm, Git e Codex CLI autenticado no mesmo
Ubuntu. Os comandos do turno usam somente bibliotecas nativas do Node;
nao exigem `npm ci`, Supabase, Stripe, tmux ou a extensao privada Millennium.

Em **Terminal > Executar Tarefa**, escolha **Millennium: diagnostico do turno**.
Confira a pasta e o acesso ao Codex. O diagnostico nao envia prompts. Se o
acesso nao estiver disponivel, execute `codex login` nesse mesmo terminal;
o login da extensao Windows nao prova o acesso da CLI no Ubuntu.

## Uma tarefa por turno

1. **Millennium: preparar branch de trabalho**: informe um nome como
   `diario-de-turno`. Com arquivos limpos, muda para `develop`, faz
   `git pull --ff-only` e cria `feature/diario-de-turno`. Se houver alteracoes,
   o fluxo para sem reset, stash, commit ou sobrescrita automaticos.
2. **Millennium: abrir turno**: informe um objetivo pequeno e um criterio
   verificavel. Exemplo: validar a descricao de uma anomalia ficticia;
   texto vazio deve gerar erro e texto valido deve ser normalizado.
3. **Millennium: planejar tarefa**: o Codex recebe objetivo e criterio, em
   somente leitura. Leia o resultado no terminal e em `response.md`, no
   caminho de evidencias mostrado. Esta etapa usa o acesso/modelo do Codex.
4. **Millennium: executar tarefa (altera arquivos)**: selecionar essa tarefa
   autoriza a implementacao na feature atual. O executor nao permite escrita
   fora de `feature/*`; nunca faz commit, merge, push, deploy ou cobranca.
5. **Millennium: testar e registrar evidencia**: informe o script npm que
   verifica **sua tarefa**, existente no `package.json`. Para testar o executor
   em si, use `test:millennium`; isso nao valida arbitrariamente qualquer app.
6. **Millennium: revisar tarefa**: uma nova revisao somente leitura confere o
   objetivo e o codigo atual. Achados nao sao corrigidos automaticamente.
   Voce pode pedir outra execucao explicitamente; nao ha loop autonomo.
   Ela recebe referencias aos logs dos testes e nao tenta escrever no sandbox.
7. Abra o resultado, leia o diff e a revisao. **Millennium: confirmar aceite**
   pede sua evidencia. Resposta do agente nao basta: exige execucao e revisao
   concluidas e um teste com exit code zero sobre os arquivos atuais. A
   evidencia humana precisa explicar por que o criterio foi atendido.
8. **Millennium: encerrar turno**: registre resumo e proxima acao. Pode encerrar
   com trabalho pendente; ele permanece pendente. `handoff.md` guarda a
   passagem de servico. Retomar nao repete comandos nem inicia IA.

Os testes nao garantem que a revisao encontrou todos os defeitos. Um teste
generico que passa nao comprova o criterio de aceite de uma funcionalidade.

## Os mesmos comandos no terminal

Execute uma linha por vez, na raiz do projeto:

```sh
npm run millennium -- doctor
npm run millennium -- prepare --name diario-de-turno
npm run millennium -- start --objective "Validar uma anomalia ficticia" --acceptance "Vazio gera erro e texto valido e normalizado"
npm run millennium -- plan
npm run millennium -- run --approved
npm run millennium -- check --script test:millennium
npm run millennium -- review
npm run millennium -- accept --evidence "Li o diff e a revisao e conferi os testes pertinentes"
npm run millennium -- close --summary "Registre o resultado real" --next "Defina a proxima acao"
npm run millennium -- status
```

O exemplo de `check` acima testa o executor, nao a validacao de anomalias.
Use o script de teste criado para seu exercicio antes de aceitar esse exercicio.

`--model ID` permite escolher o modelo em plan/run/review. Sem essa opcao,
o executor preserva a selecao do Codex; nao promete um modelo diferente nem
infere o modelo efetivo quando o evento nao o informa.

## Interromper e retomar

Use **Millennium: parar execucao** em outra tarefa/terminal ou:

```sh
npm run millennium -- stop
npm run millennium -- status
npm run millennium -- resume
```

O pedido de parada e lido pelo processo dono da execucao. Ele encerra seu
grupo de processos no Linux e registra cancelamento, sem apagar alteracoes.
`Ctrl+C` e o timeout tambem encerram a tentativa. O limite padrao e 10
minutos, ajustavel por `--timeout-ms`, ate uma hora. Se o processo morrer,
`status` reconhece uma tentativa interrompida **somente depois que o executor
e o filho nao estiverem ativos**. Nao libera um lock apenas porque passou tempo.
Um filho orfao ainda vivo exige conferir/parar esse processo; nao inicie outro.

Retomar restaura o estado local e a proxima acao. Nao e `codex resume`: cada
tentativa e uma execucao nova, com a referencia da ultima resposta pertinente,
sem reenviar automaticamente toda a conversa. Logs completos ficam disponiveis.

## Onde ficam os registros

`.millennium/` e privado e ignorado pelo Git. Nunca adicione com `git add -f`.
Pode conter texto, comandos, caminhos e codigo do projeto; revise antes de
compartilhar. O executor nao le arquivos de credenciais ou auth.json e exclui
`.env*` dos diffs. Isso nao garante que uma ferramenta do agente nunca revele
um segredo em sua saida: os logs continuam privados e precisam de revisao.

- `state.json`: projeto, turno, tarefa, estado, tentativas e testes.
- `attempt-ID/`: prompt, resposta, eventos JSONL, stderr e diffs antes/depois.
- `handoff.md`: passagem de turno mais recente.
- `turn-ID.json`: arquivo de um turno anterior ao abrir uma nova tarefa.

Resposta final ausente, falha do provedor ou alteracao durante etapa somente
leitura nao viram sucesso. Uso de tokens e registrado quando informado;
custo e modelo efetivo nao informado ficam indisponiveis. Nao ha estimativa
disfarcada de medicao nem economia de tokens comprovada.

O sandbox do Codex e o Git sao controles auxiliares, nao isolamento para
executar projetos hostis de terceiros. Codex e scripts npm trabalham com
as permissoes do usuario. O primeiro prototipo e pessoal e local.

## Testar e integrar

```sh
npm run test:millennium
git diff --check
```

Os testes geram repositorios temporarios e simulam o provedor; nao exigem
login, rede, segredos ou tokens. O workflow `Millennium local` executa a suite
em features/develop/preview e PRs. Ele nao faz deploy nem merge automatico.

Ensaio opcional com Codex real (consome tokens; usa somente dados ficticios):

```sh
node scripts/millennium/tests/live-smoke.mjs --approved
```

O ensaio preserva seu repositorio ficticio e logs em `.millennium/live-ID/`,
dentro desta copia do projeto, nao em `/tmp`. Verifica os resultados da funcao
independentemente da resposta da IA e nao gera aceite humano. Nao faz parte
da suite automatica de CI.

Integre a feature somente em `develop` depois de revisar/testar. Preparacao
de QA (`develop -> preview` + tag anotada) e release (`preview -> main`)
dependem de pedidos separados. Nenhuma dessas promocoes acontece pelo executor.

Integracao: [documentacao oficial de codex exec](https://learn.chatgpt.com/docs/non-interactive-mode).

Ainda precisa ser observado Gabriel usando esse fluxo; testes tecnicos nao
equivalem a aceite de usabilidade. A interface web, Claude, multiplos agentes,
SQL, acesso pelo celular e Pix sandbox continuam fora deste incremento.
