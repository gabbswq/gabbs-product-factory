# Validação do fluxo

Esta página distingue o que foi testado do que ainda é hipótese. Não contém conversas privadas, credenciais ou relatórios brutos.

[Voltar ao README](../README.md) · [Guia de uso](OPERATING_SYSTEM.md)

## Verificação em 24/09/2026

| Verificação | Resultado | Alcance |
| --- | --- | --- |
| Testes da extensão local no Ubuntu | 10 de 10 aprovados | Exportação, registros inválidos, isolamento de projetos e comandos do menu |
| Test-Setup.ps1 | Aprovado | Quatro workspaces, 24 combinações papel/modo em dry run, sintaxe dos scripts e TXT acima de 2 MB |
| Reexportação do ciclo gravado | Aprovada | 11 registros, 41.523 bytes e 975 linhas, conferidos contra os registros originais |

Os testes do menu usam simulações da API do VS Code; não equivalem a clicar em todos os controles do editor. A suíte é destinada ao Ubuntu/WSL, onde a extensão roda. Uma execução no Windows falhou no teste de caminhos de workspaces; a execução no ambiente de destino passou.

## Ensaio com IA realizado em 18/09/2026

Foi executado um ciclo de leitura: prompt, resposta, TXT, auditoria independente do código, prompt corretivo na mesma conversa e resposta revisada. A revisão tratou quatro lacunas na análise da integração de checkout.

- Primeira rodada: 26,985 segundos; segunda: 39,483 segundos.
- Total reportado pelo ensaio: 74.729 tokens, dos quais 46.080 eram entrada em cache, um subconjunto do total.
- O TXT final preservou os prompts, respostas e resultados de ferramentas reconhecidos pelo exportador.
- O código do produto não foi alterado pelo ensaio.

Em 24/09 a evidência gravada foi revalidada, sem chamar novamente o modelo. O tempo acima não inclui a auditoria externa entre rodadas e não é um benchmark comparativo de custo.

O usuário também apresentou uma captura de envio e resposta no painel Codex da janela Lead. Isso confirma aquele uso do chat, não todos os outros papéis ou controles.

## Limites importantes

- Não foi demonstrada economia de tokens contra uma linha de base controlada.
- Não há orquestração autônoma ou comunicação automática entre os quatro papéis.
- Não foram validados pagamentos reais, concorrência de agentes ou recuperação de inferência após falhas.
- Claude Code não foi testado com inferência; outros provedores não estão integrados.
- O botão Comprar da aplicação permanece desativado. A API de checkout ainda precisa de tratamento e testes para cenários como corpo JSON null e falha de rede.
- Um histórico antigo do Claude/Frontend contém um registro incompleto. O exportador o recusa; o original foi preservado.
- Exportar sem teto próprio não elimina limites do modelo, truncamento anterior ou necessidade de revisar dados sensíveis.

## Repetir no setup pessoal

Estes testes ficam fora deste repositório, em `C:\dev\fabrica`. Clonar apenas o GitHub não fornece os scripts nem os históricos usados na verificação.

No Ubuntu/WSL, com Node disponível:

```sh
node --test /mnt/c/dev/fabrica/vscode-extension/tests/*.test.cjs
node /mnt/c/dev/fabrica/tests/verify-live-cycle.cjs
```

No PowerShell:

```powershell
& C:\dev\fabrica\tests\Test-Setup.ps1
```

O primeiro testa o código local com dados de teste. O segundo lê a evidência existente e gera outra exportação local, sem enviar prompts. O script PowerShell verifica o setup e usa arquivos temporários, sem chamar modelos.

Os relatórios completos permanecem privados em `C:\dev\fabrica\validacao`. A documentação pública resume o alcance dos testes; não transforma o setup pessoal em um pacote pronto para distribuição.
