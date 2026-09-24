# Usar a Factory no VS Code

Este é o guia atual do setup pessoal. O caminho principal é o chat no editor, sem abrir tmux ou copiar o terminal com o mouse.

[Voltar ao README](../README.md) · [Validação e limites](WORKFLOW_VALIDATION.md)

## Primeira abertura

1. No Windows, abra **Abrir Fabrica**, o atalho em `C:\dev`.
2. Confira **Fabrica | lead** no título e **WSL: Ubuntu** no canto inferior esquerdo.
3. Use o painel **Codex**. Se não aparecer, clique em **Fabrica: lead** na barra inferior e escolha **Conversar com Codex**. A paleta de comandos também oferece **Fabrica: Abrir chat Codex**.
4. Se o painel pedir login, faça-o diretamente na extensão. Não compartilhe senha, código de acesso ou chave.
5. Envie o prompt abaixo. Ele pede apenas um diagnóstico, sem alterações.

```text
Você é o Lead deste projeto. Confirme a pasta em que está trabalhando.
Leia AGENTS.md, README.md e docs/OPERATING_SYSTEM.md.
Confira o git status e os arquivos necessários para entender o estado atual.
Explique em português o que existe, o que está pendente e proponha uma tarefa pequena.
Não altere arquivos, não instale dependências e não faça commit, push ou deploy.
```

Não precisa decorar comandos para conversar. O terminal integrado fica disponível para verificações quando for necessário.

**Em uma instalação nova:** os atalhos, workspaces e a extensão Gabbs Fabrica são locais e não vêm com este clone. Abra a pasta pelo VS Code com WSL e use o assistente de sua preferência. O menu personalizado exige o pacote privado já instalado; este guia não promete um instalador público.

## Um ciclo completo

1. **Definir:** descreva o resultado desejado e o que não pode mudar.
2. **Planejar:** envie o briefing ao papel adequado e leia o plano.
3. **Autorizar:** aprove uma alteração pequena, com critérios de aceite e sem permissões irrestritas.
4. **Executar:** aguarde o agente concluir. Peça os arquivos alterados, os testes executados e as limitações.
5. **Exportar:** menu **Fabrica > Exportar conversa salva em TXT**; escolha pela data e identificador.
6. **Auditar:** revise o TXT antes de compartilhar. Confira também o código e os testes, não apenas a explicação do agente.
7. **Corrigir:** envie os achados na mesma conversa e confira a nova resposta.
8. **Fechar:** revise o diff e só então autorize commit, integração e publicação.

Prompt para a etapa de execução:

```text
Execute apenas a tarefa e os arquivos aprovados no plano anterior.
Preserve mudanças preexistentes e não altere credenciais.
Valide os critérios de aceite com testes adequados.
Ao terminar, liste mudanças, comandos executados, resultados e pendências.
Não faça commit, merge, push ou deploy sem minha aprovação.
```

Prompt de retorno após a auditoria:

```text
Considere os achados abaixo e confira cada um contra o código.
Corrija somente os problemas confirmados, no escopo aprovado.
Explique qualquer discordância com evidências. Execute novamente os testes relevantes.
Achados:
[descreva os problemas e os critérios de aceite]
```

## Onde está tudo

Estes caminhos descrevem o computador em que o setup foi preparado, não um requisito universal.

| Local | Conteúdo |
| --- | --- |
| `C:\dev\fabrica\COMECE-AQUI.md` | Guia local e atalhos do fluxo |
| `C:\dev\fabrica\workspaces` | Janelas por papel |
| `C:\dev\fabrica\prompts` | Modelos de briefing |
| `C:\dev\fabrica\relatorios` | Exportações em TXT |
| `C:\dev\fabrica\validacao` | Evidências privadas do ensaio |
| `C:\dev\fabrica\vscode-extension` | Código da extensão privada |
| `~/ai-projects/gabbs-product-factory` | Projeto principal no Ubuntu |
| `~/ai-projects/worktrees/gabbs-product-factory/` | Pastas frontend, backend e database |

Os papéis abrem em janelas separadas. Use o Lead para coordenação e um papel especializado por tarefa. Não execute dois agentes escrevendo na mesma pasta.

## O que vai para o TXT

O exportador inclui mensagens visíveis e chamadas/resultados de ferramentas disponíveis nos registros locais do papel selecionado. Não impõe teto artificial de linhas ou caracteres.

Não inclui raciocínio interno, mensagens de sistema, imagens binárias nem conversas de subagentes. Não recupera trechos que já foram truncados antes de chegar ao registro. Um histórico incompleto gera erro; espere a resposta terminar antes de exportar.

O TXT **não é anonimizado automaticamente**. Revise chaves, dados pessoais e conteúdo privado antes de enviar para outro chat ou serviço. Os relatórios não devem ser publicados no GitHub.

Na mesma conversa, o novo prompt pode conter apenas os achados e a próxima tarefa. Guarde o arquivo integral para auditoria; reenviar tudo não garante melhor resultado e pode aumentar o consumo.

## Provedores e retomada

Codex é a entrada atual. Claude Code está preparado no setup local, mas exige acesso válido próprio e não foi validado com inferência neste ensaio. OpenRouter, Ollama e Qwen não estão conectados a um roteador.

Trocar de ferramenta não transfere automaticamente assinatura, credenciais ou histórico. Se mudar de provedor, forneça um handoff revisado e sem segredos.

Retome pelo histórico do painel, na janela do papel correto. Para parar uma execução, use o controle do chat antes de fechar. Suspender ou desligar o computador interrompe a disponibilidade do ambiente local; não é uma máquina autônoma 24 horas.

## Aplicação experimental

Não é necessário iniciar a aplicação Next.js para usar os agentes e revisar código.

Para desenvolver a aplicação, execute os comandos no terminal integrado **do WSL**, na raiz do projeto:

| Comando | Efeito |
| --- | --- |
| `npm ci` | Instala as dependências do lockfile; substitui a instalação local em node_modules |
| `npm run dev` | Inicia o servidor Next.js; abra a URL que ele informar |
| `npm run typecheck` | Confere os tipos TypeScript |
| `npm run build` | Gera e verifica a versão de produção |
| `npm run start` | Serve o build já gerado |

O servidor fica executando no terminal. Nesse terminal, **Ctrl+C** encerra o servidor; não é um comando de copiar texto.

A conexão real com Supabase usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Algumas rotas de servidor dependem de `SUPABASE_SERVICE_ROLE_KEY`; essa chave nunca deve ir para o navegador.

As Edge Functions têm configuração própria: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CHECKOUT_SUCCESS_URL` e `CHECKOUT_CANCEL_URL`, conforme a função. A integração experimental Discord possui outras variáveis. A existência dos nomes não significa que esses serviços estejam configurados.

Não edite `.env`, publique segredos, aplique migrations ou ative pagamentos sem uma etapa específica de revisão e autorização. O fluxo de compra ainda exige implementação e testes próprios em ambiente de teste.

## Alternativa antiga

tmux e os scripts anteriores foram preservados. Para consultar as sessões no Ubuntu, use `tmux ls`; para entrar em uma existente, `tmux attach -t lead`. Para sair sem encerrar a sessão, pressione **Ctrl+B**, solte e pressione **D**.

Isso é opcional. Não use procedimentos de exclusão/recriação de worktrees como forma de “reabrir” a fábrica.

Antes de atualizar branches de papéis, confira o estado de cada uma. Não faça reset nem descarte mudanças para sincronizar. O [handoff](CHATGPT_HANDOFF.md) guarda o histórico; snapshots antigos não devem substituir a leitura do código atual.
