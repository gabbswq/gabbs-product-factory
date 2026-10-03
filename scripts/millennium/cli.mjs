import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Store } from './store.mjs';
import { project, prepare } from './project.mjs';
import { doctor, run } from './runner.mjs';

export const help = `Millennium | turno local no VS Code

doctor                         conferir projeto, Node e acesso ao Codex
prepare --name meu-turno        develop + pull --ff-only + feature/meu-turno
start --objective "..." --acceptance "..."   abrir uma tarefa
plan                           pedir plano ao Codex (somente leitura)
run --approved                 executar a tarefa na feature atual
review                         revisar com Codex (somente leitura)
check --script test:millennium  executar um script npm e salvar a evidencia
accept --evidence "..."         confirmar o aceite humano apos revisao/teste
close --summary "..." --next "..."           salvar passagem de turno
resume                         retomar estado, sem executar nada
status                         mostrar tarefa, tentativas e proxima acao
stop                           solicitar cancelamento da execucao ativa

Opcoes de plan/run/review: --model ID e --timeout-ms 600000.
Sem servidor, sem banco remoto, sem commit/push automatico.
Historico privado em .millennium/; nao publique seus logs sem revisar.
`;

function show(state, out) {
  if (!state) { out.write('Nenhum turno. Use start ou Terminal > Executar Tarefa > Millennium: abrir turno.\n'); return; }
  out.write(`Turno: ${state.turn.status}\nBranch: ${state.task.branch}\nTarefa: ${state.task.objective}\nAceite: ${state.task.acceptance}\nEstado: ${state.task.status}\n`);
  for (const attempt of state.attempts) {
    out.write(`- ${attempt.mode}: ${attempt.status}; ${attempt.artifacts}\n`);
    if (attempt.error) out.write(`  Falha: ${attempt.error}\n`);
  }
  const next = state.turn.next_action ?? ({
    planejada: 'plan', aguardando_usuario: 'conferir plano e run --approved',
    executando: 'aguardar ou stop', em_revisao: 'review / check / accept',
    bloqueada: 'ler logs e corrigir o impedimento antes de tentar novamente',
    cancelada: 'conferir arquivos; executar outra tentativa somente por decisao explicita',
    interrompida: 'conferir arquivos; executar outra tentativa somente por decisao explicita',
    concluida: 'close para registrar a passagem de turno',
  }[state.task.status]);
  out.write(`Proxima acao: ${next}\n`);
  const usage = state.attempts.findLast(item => item.usage)?.usage;
  out.write(`Uso informado pelo provedor: ${usage ? JSON.stringify(usage) : 'indisponivel'}; custo: indisponivel.\n`);
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd(), out = process.stdout) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: {
    name: { type: 'string' }, objective: { type: 'string' }, acceptance: { type: 'string' },
    model: { type: 'string' }, 'timeout-ms': { type: 'string' }, approved: { type: 'boolean' },
    script: { type: 'string' }, evidence: { type: 'string' }, summary: { type: 'string' }, next: { type: 'string' },
    help: { type: 'boolean' },
  } });
  const command = positionals[0];
  if (!command || command === 'help' || values.help) { out.write(help); return 0; }
  if (positionals.length !== 1) throw new Error('Use um comando por vez. Consulte help.');
  if (command === 'doctor') {
    const result = doctor(project(cwd));
    out.write(JSON.stringify(result, null, 2) + '\n');
    if (!result.codex) out.write('Codex nao encontrado. Abra o terminal Ubuntu em que a CLI esta instalada.\n');
    else if (!result.authenticated) out.write(`No mesmo terminal Ubuntu, execute ${result.codex_path} login e tente doctor novamente.\n`);
    return result.authenticated ? 0 : 1;
  }
  const store = new Store(cwd);
  store.recover();
  if (command === 'prepare') {
    store.locked(() => {
      const state = store.state();
      if (store.read('run.lock') || (state && (state.turn.status === 'aberto' || state.task.status !== 'concluida'))) {
        throw new Error('Confira/encerre o turno atual antes de preparar outra branch.');
      }
      out.write(`Branch pronta: ${prepare(cwd, values.name).branch}\n`);
    });
    return 0;
  }
  if (command === 'start') show(store.start(values.objective, values.acceptance), out);
  else if (command === 'status') show(store.state(), out);
  else if (command === 'stop') { store.stop(); out.write('Cancelamento solicitado. Aguarde o executor registrar o encerramento.\n'); }
  else if (command === 'accept') show(store.accept(values.evidence), out);
  else if (command === 'close') show(store.close(values.summary, values.next), out);
  else if (command === 'resume') show(store.resume(), out);
  else if (['plan', 'run', 'review', 'check'].includes(command)) {
    const state = await run(store, command === 'run' ? 'work' : command, {
      approved: values.approved, model: values.model, script: values.script,
      timeout: values['timeout-ms'] ? Number(values['timeout-ms']) : 600_000, output: out,
    });
    show(state, out);
    return ['bloqueada', 'cancelada', 'interrompida'].includes(state.task.status) ? 1 : 0;
  } else throw new Error('Comando desconhecido. Use npm run millennium -- help.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    console.error(`Millennium: ${error.message}`);
    process.exitCode = 1;
  });
}
