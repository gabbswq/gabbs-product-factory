import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { Store } from '../store.mjs';
import { run, doctor } from '../runner.mjs';

export function createSmokeRoot(cwd) {
  const parent = new Store(cwd);
  parent.init();
  return fs.mkdtempSync(path.join(parent.dir, 'live-'));
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  if (!argv.includes('--approved')) {
    throw new Error('Este ensaio chama Codex real e consome uso do provedor. Adicione --approved para autorizar.');
  }

  const root = createSmokeRoot(cwd);
  const git = (...args) => execFileSync('git', ['-C', root, '-c', 'core.hooksPath=/dev/null',
    '-c', 'commit.gpgsign=false', '-c', 'user.name=Millennium Smoke', '-c', 'user.email=smoke@example.invalid', ...args], { stdio: 'pipe' });
  git('init', '-b', 'develop');
  fs.writeFileSync(path.join(root, '.gitignore'), '.millennium/\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ type: 'module', scripts: { test: 'node --test anomaly.test.mjs' } }, null, 2));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), `# Exercicio isolado Millennium
Somente dados ficticios. A branch feature ja foi preparada.
Nao altere Git, credenciais, arquivos .millennium, package.json ou este guia.
Nao publique, cobre ou use MCPs externos. Trabalhe apenas em anomaly.mjs e anomaly.test.mjs.
Para testar use npm test. Nao declare aceite humano nem implemente um site.
`);
  git('add', '.'); git('commit', '-m', 'test: initialize isolated learning exercise');
  git('switch', '-c', 'feature/validar-anomalia');
  const store = new Store(root);
  console.log(`Ensaio real, arquivos e evidencias preservados em: ${root}`);
  assert.equal(doctor(store.info).authenticated, true, 'Codex CLI deve estar autenticado');
  store.start('Criar validateAnomaly em anomaly.mjs e testes em anomaly.test.mjs. A funcao recebe uma descricao e devolve {ok:false,error:"Descricao obrigatoria"} para valores nao-string ou texto vazio; para texto nao-vazio devolve {ok:true,description: texto com espacos externos removidos}.',
    'npm test passa com string vazia, espacos, null, numero e descricao valida. Sem dependencias externas.');
  try {
    assert.equal((await run(store, 'plan', { timeout: 180_000 })).task.status, 'aguardando_usuario');
    assert.equal((await run(store, 'work', { approved: true, timeout: 240_000 })).task.status, 'em_revisao');
    assert.equal((await run(store, 'check', { script: 'test' })).task.status, 'em_revisao');
    assert.equal((await run(store, 'review', { timeout: 180_000 })).task.status, 'em_revisao');
    const { validateAnomaly } = await import(path.join(root, 'anomaly.mjs'));
    for (const input of ['', '   ', null, 2]) assert.deepEqual(validateAnomaly(input), { ok: false, error: 'Descricao obrigatoria' });
    assert.deepEqual(validateAnomaly('  sensor ficticio  '), { ok: true, description: 'sensor ficticio' });
    assert.equal(store.state().accepted_evidence, null, 'Ensaio automatico nao substitui aceite de Gabriel');
    store.close('Ensaio tecnico automatico: plano, implementacao, revisao e testes. Nao e aceite humano.',
      'Gabriel usar o fluxo e explicar a funcao, o teste e o diff.');
    assert.equal(new Store(root).state().turn.status, 'encerrado');
    console.log('Ensaio real passou. Evidencias locais preservadas; nenhuma release ou aceite humano gerado.');
  } catch (error) {
    console.error(`Ensaio incompleto: ${error.message}. Confira ${root}/.millennium antes de repetir.`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
