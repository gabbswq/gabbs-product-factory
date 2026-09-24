# Gabbs Product Factory

**Ideias, código e revisão com IA, dentro do VS Code.**

Uma base pessoal de trabalho para desenvolver produtos em tarefas pequenas, com contextos separados por papel e evidências que podem ser auditadas. A fábrica é o processo de trabalho; não é um chat web nem um construtor automático de aplicações.

[Começar no VS Code](docs/OPERATING_SYSTEM.md) · [Validação e limites](docs/WORKFLOW_VALIDATION.md) · [Regras para agentes](AGENTS.md)

## Como funciona

```text
Ideia → prompt → agente no VS Code → resposta e código
                                      ↓
                              exportação em TXT
                                      ↓
                              auditoria externa
                                      ↓
                           próximo prompt → validar
```

Você decide a tarefa e autoriza as mudanças. O agente executa no contexto do projeto, o resultado é revisado e a próxima rodada recebe instruções específicas. Os quatro papéis não conversam nem trabalham automaticamente entre si.

## Começar

**No setup pessoal já instalado:** abra o atalho **Abrir Fabrica**, confira **WSL: Ubuntu** e a janela **Fabrica | lead**. Use o painel **Codex**. O menu **Fabrica** permite abrir o guia, trocar de papel e exportar uma conversa salva.

**Para quem está chegando pelo GitHub:** clonar este repositório não instala o menu Fabrica. A extensão privada, os atalhos e o exportador ficam no setup local; ainda não são distribuídos aqui. É possível abrir o código no VS Code e trabalhar com um assistente disponível, seguindo o mesmo procedimento de revisão.

O passo a passo, as pastas e um primeiro prompt estão no [guia de operação](docs/OPERATING_SYSTEM.md).

## Papéis

| Papel | Responsabilidade |
| --- | --- |
| Lead | Entender a ideia, delimitar tarefas e revisar resultados |
| Frontend | Telas, componentes, acessibilidade e interação |
| Backend | APIs, autenticação e regras de negócio |
| Database | Schema, migrations, consultas e permissões |

Os papéis usam **Git worktrees** para manter pastas e branches isoladas. Não é necessário abrir todos de uma vez. Commit, merge, push, deploy e mudanças externas exigem aprovação.

## O que existe hoje

| Parte | Estado |
| --- | --- |
| Trabalho no VS Code + WSL | Setup pessoal configurado, com janelas por papel |
| Exportação de conversas em TXT | Testada, sem teto artificial de linhas ou caracteres |
| Ciclo prompt → auditoria → nova resposta | Ensaio de leitura realizado; evidências revalidadas |
| Claude Code | Preparado no setup local; inferência não validada |
| OpenRouter, Ollama e Qwen | Possibilidades futuras, sem integração instalada |
| Orquestração autônoma entre agentes | Não implementada |
| Economia de tokens | Hipótese a medir, não resultado demonstrado |

O histórico completo fica como evidência. Na mesma conversa, envie os novos achados em vez de repetir tudo. Os limites do modelo e de anexos continuam existindo; o exportador não recupera conteúdo que o provedor não gravou.

## Código experimental neste repositório

A fábrica nasceu junto de um projeto de conteúdo e produtos digitais. Esse código foi preservado e **não representa um gateway de pagamentos pronto para produção**.

Há páginas de artigos, catálogo e detalhe de produtos, autenticação, dashboard, APIs de produto e um proxy de checkout. Existem migrations e Edge Functions para checkout e webhook. O botão **Comprar** no detalhe do produto ainda está desativado; a presença dessas rotas não comprova pagamento de ponta a ponta.

| Tecnologia | Uso |
| --- | --- |
| Next.js 15, React 19 e TypeScript | Aplicação experimental |
| Tailwind CSS e Radix UI | Componentes e interface |
| Supabase e PostgreSQL | Autenticação, dados, RLS e migrations |
| Supabase Edge Functions e Stripe | Código de integração de pagamentos |
| VS Code, WSL e Git worktrees | Ambiente de desenvolvimento |
| Codex / Claude Code | Assistentes, sujeitos ao acesso de cada provedor |

As versões exatas estão em [`package-lock.json`](package-lock.json). tmux e scripts antigos foram preservados como alternativa; não são requisito do fluxo visual atual.

## Abrir o código

No terminal do Ubuntu/WSL:

```sh
git clone https://github.com/gabbswq/gabbs-product-factory.git
cd gabbs-product-factory
code .
```

Se a pasta já existe, abra a cópia atual em vez de clonar novamente. No VS Code, **Arquivo > Abrir Pasta** também permite selecionar o projeto.

Para executar a aplicação experimental, os scripts disponíveis são:

```sh
npm ci
npm run dev
npm run typecheck
npm run build
```

Leia cada comando como uma ação separada: `dev` mantém um servidor aberto; `typecheck` e `build` são verificações posteriores. Configurar Supabase e pagamentos é uma etapa independente, descrita no [guia](docs/OPERATING_SYSTEM.md#aplicação-experimental). Não use credenciais de produção em testes nem publique arquivos `.env`.

## Mapa do repositório

| Caminho | Conteúdo |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Regras de trabalho e segurança |
| [`docs/OPERATING_SYSTEM.md`](docs/OPERATING_SYSTEM.md) | Guia atual de uso no VS Code |
| [`docs/WORKFLOW_VALIDATION.md`](docs/WORKFLOW_VALIDATION.md) | Evidências, testes e limites |
| [`docs/CHATGPT_HANDOFF.md`](docs/CHATGPT_HANDOFF.md) | Passagem de contexto e documentos históricos |
| [`TASKS.md`](TASKS.md) | Registro de tarefas do código experimental |
| [`src/`](src/) | Aplicação Next.js |
| [`supabase/`](supabase/) | Migrations e Edge Functions |
| [`scripts/`](scripts/) | Utilitários versionados |

Documentos de visão e handoffs antigos descrevem etapas anteriores. Para o fluxo diário, comece pelo guia atual. O experimento de interface web do Studio foi retirado do fluxo operacional; uma eventual landing page serve apenas para apresentar o projeto e apontar para este repositório.

## Princípios

Tarefas pequenas. Aprovação humana. Evidências verificáveis. Credenciais fora das conversas e do Git. Backup antes de reorganizar. Nenhuma promessa de execução ilimitada ou produto pronto apenas porque um agente respondeu.

[Segurança](docs/SECURITY.md) · [Gabriel Diniz](https://github.com/gabbswq)

