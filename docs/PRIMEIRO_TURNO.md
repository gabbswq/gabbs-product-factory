# Meu primeiro turno no Millennium

O objetivo desta sessão é entender o projeto e terminar sabendo o próximo passo. Reserve 20 a 30 minutos. Este roteiro usa o setup pessoal que já existe.

**Na cópia `develop`, existe agora uma alternativa executável:** abra a raiz
no VS Code/WSL e siga [Turno local](TURNO_LOCAL.md). Ela salva tarefa,
respostas, revisão, testes e passagem de serviço sem copiar TXT manualmente.
Comece pela tarefa **Millennium: diagnostico do turno**. O procedimento abaixo
continua como alternativa de conversa no painel, não como prova de que o novo
executor já foi aceito por Gabriel.

1. No Windows, abra `C:\dev\Abrir Millennium.cmd`.
2. No VS Code, confira **Millennium | lead** no título e **WSL: Ubuntu** embaixo. Clique em **Millennium: lead** e escolha **Conversar com Codex**.
3. Envie a mensagem abaixo no painel Codex. Você pode conversar em português; não precisa começar pelo terminal.

```text
Vamos abrir meu primeiro turno de aprendizado no Millennium.
Leia AGENTS.md, README.md e docs/MILLENNIUM_SPEC.md.
Confirme a pasta e as alteracoes ja existentes antes de propor trabalho.
Explique em linguagem simples o que funciona hoje e o que ainda e proposta.
Proponha uma unica tarefa de ate 30 minutos que me ensine um conceito de Git,
VS Code ou programacao. Diga como vou verificar o resultado e qual arquivo
vou ler. Nesta primeira resposta, apenas explique e proponha a tarefa.
```

4. Leia a proposta. Quando entender o objetivo, peça a execução e acompanhe os arquivos que mudam. O ícone de ramificação à esquerda mostra o controle de versão: clique num arquivo alterado para ver antes/depois.
5. Confira o resultado e peça: **Explique uma mudança importante e me ensine a testar essa parte.** Execute essa verificação com orientação.
6. Para encerrar, peça: **Prepare uma passagem de turno com o que foi feito, o que foi testado, as anomalias, o que falta e a primeira ação da próxima sessão. Salve em docs/HANDOFF_MILLENNIUM.md, preservando referências úteis da passagem anterior.**

Quando retornar, comece por: **Leia docs/HANDOFF_MILLENNIUM.md, confira o estado atual dos arquivos e me mostre a próxima tarefa.**

## O que cada coisa significa

| Termo | Uso no dia a dia |
| --- | --- |
| VS Code | A janela em que você vê o projeto, os arquivos, o chat e o terminal |
| Ubuntu/WSL | Ambiente Linux onde este projeto e suas ferramentas trabalham |
| Terminal | Campo para executar comandos; abra por Terminal > Novo Terminal |
| Codex | Assistente que lê, altera e verifica o projeto conforme sua tarefa |
| Git | Histórico de alterações; `M` no arquivo significa modificado |
| Diff | Comparação do arquivo antes e depois |
| Commit | Registro de alterações selecionadas no histórico |
| SPEC | Descrição do que construir e de como reconhecer que funcionou |
| Teste | Verificação do comportamento esperado, incluindo erros |
| Handoff | Passagem de turno para retomar depois |

No terminal Ubuntu do VS Code, `pwd` mostra a pasta atual e `git status` mostra as alterações. Ambos são comandos de consulta. O comando `codex` abre o assistente no terminal; usar o painel visual também funciona. Escolha uma entrada por tarefa para acompanhar melhor o contexto.

O menu **Millennium > Exportar conversa salva em TXT** continua disponível para uma auditoria em outro chat. Para continuar a mesma conversa, envie apenas o próximo pedido; não precisa reenviar todo o histórico.

As telas próprias de turnos, a coordenação automática e o acesso pelo celular estão descritos como etapas futuras na SPEC. Este guia é o procedimento atual no VS Code.
