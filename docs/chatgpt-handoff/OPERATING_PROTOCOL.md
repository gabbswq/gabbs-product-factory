# Protocolo Operacional

Como Sala de Controle (ChatGPT), agentes (Claude Code / Codex) e Gabriel se relacionam.

## Papéis

- **Gabriel** — operador humano. Roda comandos, cola respostas, decide.
- **ChatGPT (Sala de Controle)** — coordena, planeja, revisa, escolhe o agente certo e dá comandos seguros.
- **Agentes** — executam código nos worktrees. Cada um tem escopo:
  - `lead` — planejamento, arquitetura, decisão. Roda na pasta principal, **não** em worktree própria.
  - `frontend` — páginas, UI, experiência.
  - `backend` — APIs, auth, Stripe, Edge Functions.
  - `database` — migrations, schema, RLS, SQL.
  - `lead-opus` — revisão estratégica forte. **Não implementa código.**

## Princípios

- Planejar antes de editar.
- Não inventar arquitetura sem ler os arquivos.
- Não mexer em credenciais.
- Usar git como checkpoint.
- Preferir mudanças pequenas.
- Ao ficar sem contexto, gerar `HANDOFF.md`.

## Ciclo de uma tarefa

1. Sala de Controle define o objetivo curto e indica o agente.
2. Gabriel envia o briefing para o agente certo no tmux.
3. Agente responde. Se a resposta for longa, Gabriel roda `agent-copy <agente>`.
4. Gabriel cola no ChatGPT.
5. Sala de Controle revisa, aprova ou pede ajuste.
6. Commit só quando o passo estiver fechado.

## Regras para a Sala de Controle

- Nunca abrir várias frentes ao mesmo tempo. Uma tarefa ativa por vez.
- Confirmar a próxima tarefa antes de despachar para um agente.
- Dar comandos prontos para colar — não pseudo-código.
- Marcar claramente o agente alvo de cada comando.
- Nunca pedir comando destrutivo (`reset --hard`, `push --force`, `rm -rf`) sem motivo explícito e confirmação.
- Não tocar em `.env`, `package.json`, migrations ou Stripe sem decisão consciente.

## Como escolher o agente

- Mexeu em página, componente ou rota visual? **frontend**.
- Mexeu em API, auth, webhook ou Edge Function? **backend**.
- Mexeu em schema, RLS ou SQL? **database**.
- Decisão de arquitetura ou priorização? **lead**.
- Revisão crítica antes de commit grande? **lead-opus**.

## Lições operacionais aprendidas

Regras tiradas de erros reais. Valem para Sala de Controle e para os agentes.

1. **Documentação longa, handoff, planejamento e síntese de contexto** são trabalho de agente `lead` ou `lead-opus`. Não despachar isso para Bash gigante.
2. **Bash no Ubuntu** é para comandos pequenos, verificáveis e reversíveis. Se o comando precisa de várias telas para ler, está errado de ferramenta.
3. **Evitar heredoc gigante** (`cat <<EOF ... EOF`) para markdown longo. Quebra fácil no terminal e trava o shell em prompt `>`. Para arquivo grande, usar editor do agente.
4. **Claude Code Desktop não é o padrão operacional.** Preferir **Claude Code CLI dentro do tmux**, junto dos worktrees.
5. **ChatGPT gera prompts para agentes e comandos curtos.** Quando a tarefa é textual, não despejar scripts enormes — entregar o texto em si.
6. **Resposta grande de agente:** sempre `agent-copy <agente>`. Nunca Ctrl+C nem cópia manual com mouse.

## Sinais de que é hora de novo handoff

- Chat ficou lento ou começou a esquecer o que estava combinado.
- Mais de uma tarefa em paralelo sem necessidade.
- Sala de Controle perdeu o fio do estado dos worktrees.
- Build quebrou e ninguém sabe desde quando.

Quando isso acontecer: atualizar `CURRENT_STATE.md`, commitar, e abrir um chat novo usando `NEW_CHAT_PROMPT.md`.
