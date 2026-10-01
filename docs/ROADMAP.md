# Roadmap do Millennium

Direção vigente: [SPEC](MILLENNIUM_SPEC.md). Este roteiro separa entregas locais, validação de uso e funcionalidades futuras. Um item só é concluído quando sua evidência existe.

## 1. Direção e entrada local

- [x] Registrar a visão de fábrica de software, o ciclo de turnos e os critérios de aceite.
- [x] Aplicar Millennium à landing local, aos guias, aos títulos de workspace e à extensão privada.
- [x] Preservar backups e os identificadores necessários à compatibilidade do setup.
- [x] Disponibilizar um guia curto de primeiro turno e uma passagem de contexto atual.
- [ ] Publicar a transição de marca e verificar a versão pública no GitHub/Pages.
- [ ] Confirmar com Gabriel a abertura e o uso da janela atualizada do VS Code.

Os caminhos antigos ainda identificam as instalações existentes. Renomear um produto não exige descartar seus históricos de conversa nem recriar worktrees.

## 2. Uma tarefa realmente utilizável

- [ ] Escolher com Gabriel uma tarefa pequena do exercício Diário de Turno.
- [ ] Executar a tarefa com um assistente e revisar o código e os testes.
- [ ] Gabriel abrir o resultado, provocar um erro de validação e explicar uma mudança.
- [ ] Encerrar registrando resultado, anomalias e próxima ação.
- [ ] Retomar em outra sessão sem reconstruir todo o contexto.
- [ ] Comparar três tarefas equivalentes com o fluxo manual, medindo tempo humano, rodadas e consumo quando disponível.

**Portão de aceite:** uso observado, não apenas teste de scripts. A publicação da landing não substitui esta etapa.

## 3. Execução local persistente

- [ ] Validar uma integração documentada do assistente com autenticação existente.
- [ ] Persistir projetos, turnos, tarefas, tentativas e referências a evidências.
- [ ] Implementar estados, cancelamento e recuperação sem repetir ações automaticamente.
- [ ] Garantir uma execução de escrita por pasta e isolamento quando houver paralelismo.
- [ ] Implementar revisão delimitada e limite de tentativas de correção.
- [ ] Testar falhas de acesso, interrupção e recuperação conforme o contrato da SPEC.

**Portão de aceite:** execuções reais observáveis e recuperáveis. Respostas simuladas não comprovam integração.

## 4. Interface própria

- [ ] Criar o espaço de trabalho com conversa, resultado, alterações e próxima ação.
- [ ] Conectar a interface ao executor real e ao histórico de turnos.
- [ ] Verificar teclado, desktop e celular; manter ações e erros legíveis.
- [ ] Repetir o teste de uso com Gabriel antes de adicionar mais agentes.

A landing apresenta o produto; não é esta interface. O antigo Studio não volta automaticamente ao escopo.

## 5. Acesso remoto e distribuição

- [ ] Definir necessidade, orçamento e disponibilidade do executor.
- [ ] Projetar autenticação, isolamento, gestão de segredos e limites de consumo.
- [ ] Verificar termos das integrações, backup, restauração e tratamento de incidentes.
- [ ] Testar acesso remoto em condições reais antes de oferecer o serviço a terceiros.

## 6. Aplicação de pagamentos

- [ ] Investigar uma dor específica de comerciantes e os custos da operação.
- [ ] Escolher um parceiro e prototipar uma cobrança Pix em sandbox.
- [ ] Validar webhook, idempotência, consulta de estado, conciliação e falhas.
- [ ] Avaliar viabilidade comercial e obrigações antes de operar dinheiro real.

Cartões, carteiras e cripto exigem descoberta própria. Não há tarifa, economia ou integração comercial confirmada.

## Histórico

O [roadmap anterior](history/previous-product-direction/ROADMAP.md) registra o experimento de conteúdo, assinaturas e comunidade. Seus itens marcados não comprovam o funcionamento atual do Millennium.
