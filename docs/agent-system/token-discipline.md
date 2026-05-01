# Token Discipline for Multi-Agent Workflow

Objetivo: usar Claude Code/Codex de forma eficiente, sem queimar limite com contexto desnecessário.

## Regra central

Nunca mandar tudo de uma vez.

Errado:
- "Leia todo o projeto e refatore tudo."
- "Aqui estão 500 linhas de código, resolva tudo."
- "Analise frontend, backend, banco e segurança ao mesmo tempo."

Certo:
- "Analise apenas a estrutura e diga quais arquivos tocar."
- "Edite apenas este arquivo."
- "Valide apenas este diff."
- "Não implemente ainda, só planeje."

## Papéis dos agentes

### Lead / Planejador

Contexto baixo.

Função:
- entender a tarefa;
- dividir em partes;
- apontar arquivos;
- definir ordem;
- criar checklist;
- não editar código sem aprovação.

Prompt base:

Leia AGENTS.md, CLAUDE.md, TASKS.md e docs/agent-system/*.md.
Você é o agente líder.
Não implemente nada.
Planeje a próxima tarefa pequena e diga:
1. objetivo;
2. arquivos prováveis;
3. agente responsável;
4. riscos;
5. validações.

### Executor

Contexto médio/baixo.

Função:
- alterar arquivo específico;
- seguir plano aprovado;
- não mexer fora do escopo;
- rodar build/test quando aplicável.

Prompt base:

Você é o agente executor.
Tarefa: <tarefa>
Arquivo principal: <arquivo>
Escopo: altere apenas o necessário.
Não mexa em .env, migrations, node_modules, .next ou arquivos fora do plano.
Antes de editar, confirme plano curto.

### Validador

Contexto baixo.

Função:
- olhar git diff;
- buscar riscos;
- sugerir correções;
- não reescrever tudo.

Prompt base:

Você é o agente validador.
Revise apenas o git diff atual.
Não peça o projeto inteiro.
Diga:
1. se aprova;
2. riscos;
3. testes necessários;
4. arquivos suspeitos;
5. se pode mergear.

## Uso de diff

Preferir:

git diff --stat
git diff arquivo-especifico
git status --short

Em vez de mandar arquivo inteiro.

## Sequência ideal

1. Lead planeja.
2. Usuário aprova.
3. Executor altera poucos arquivos.
4. Build/test roda.
5. Validador revisa diff.
6. Usuário aprova merge.
7. Commit/push.

## Frases boas

- "Não implemente ainda."
- "Use apenas o arquivo X."
- "Leia somente as seções relevantes."
- "Me dê plano antes de editar."
- "Revise apenas o diff."
- "Não mexa em migrations."
- "Não mexa em .env."
- "Não invente arquitetura nova."
- "Faça mudança pequena e reversível."

## Frases perigosas

- "Arruma tudo."
- "Melhora o projeto inteiro."
- "Refatora tudo."
- "Lê todos os arquivos."
- "Faz do jeito que achar melhor."
- "Implementa tudo de uma vez."

