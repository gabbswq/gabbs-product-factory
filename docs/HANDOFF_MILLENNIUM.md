# Passagem de turno: Millennium

Registro de 1 de outubro de 2026. Revalidar antes de continuar.

## Objetivo e decisão

Gabriel confirmou **Millennium** como marca. O produto é uma fábrica pessoal de software assistida por IA, com turnos, execução, revisão, aprendizado e passagem de serviço. A experiência futura usa conversa e prévia como referências; a aplicação de pagamentos é uma iniciativa posterior, separada.

## O que foi preparado

- SPEC com requisitos, contrato de execução, arquitetura proposta e critérios de aceite.
- Primeiro turno no VS Code e alinhamento de brief, roadmap e guias.
- Nome Millennium na landing local, metadados do experimento, títulos de workspaces e extensão privada 0.1.3.
- Iniciador local `C:\dev\Abrir Millennium.cmd` e guia `C:\dev\fabrica\COMECE-AQUI.md`.
- Backups dos arquivos anteriores, sem descarte de alterações existentes.

## Evidências técnicas desta transição

- `npm --prefix landing run verify`: build, 14 testes Playwright e limite de bundle passaram.
- `node --test /mnt/c/dev/fabrica/vscode-extension/tests/*.test.cjs`: 10 testes passaram.
- `C:\dev\fabrica\tests\Test-Setup.ps1`: quatro workspaces e 24 combinações de papel/modo verificadas sem iniciar IA.
- `npm run typecheck`: passou na aplicação experimental.
- Capturas locais em 1440, 360 e 320 pixels, sem overflow horizontal detectado.
- Extensão 0.1.3 confirmada no VS Code Windows e no servidor WSL; isso não comprova que uma janela antiga foi recarregada.

Os registros e backups desta transição ficam no diretório local `millennium-transition` do chat de trabalho. Eles não devem ser publicados integralmente como documentação do produto.

## O que não foi concluído

- Publicação da transição e eventual mudança do endereço remoto.
- Uma sessão em que Gabriel execute, confira e retome uma tarefa sozinho.
- Interface própria de conversa e prévia, executor persistente e coordenação automática.
- Medição comparativa de tokens/custo e acesso pelo celular.
- Operação real de pagamentos.

Não considerar o projeto inteiro pronto com base nos testes acima.

## Preservar ao continuar

O checkout principal já tinha alterações em README, `index.html`, workflows, dependências, webhook e uma SPEC de segurança. A cópia de trabalho em `C:\dev\fabrica\web` também tem alterações próprias. Não publicar tudo junto, sobrescrever uma pela outra, resetar ou mover pastas sem verificar as referências.

Os caminhos `gabbs-product-factory` e `C:\dev\fabrica` e os IDs internos `fabrica.*` permanecem por compatibilidade. O nome exibido é Millennium. Snapshots históricos não devem ser usados como roteiro atual.

## Próxima ação concreta

Abrir `Abrir Millennium.cmd`, conferir o título Millennium/lead e o contexto Ubuntu, e seguir [PRIMEIRO_TURNO.md](PRIMEIRO_TURNO.md) com Gabriel. Começar por uma proposta pequena do exercício Diário de Turno, com dados fictícios; não construir o aplicativo inteiro antes de observar o primeiro uso.

Durante a sessão, ensinar a diferença entre arquivo, alteração (diff) e commit. Pedir que Gabriel encontre um arquivo alterado e explique uma mudança. Registrar aqui o resultado real e a próxima ação, sem marcar os critérios de usabilidade como aprovados antecipadamente.
