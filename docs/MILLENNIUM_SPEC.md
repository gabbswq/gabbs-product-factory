# Millennium

SPEC de produto, versão 0.1 · 1 de outubro de 2026

Estado: proposta de direção e critérios de aceite; as funcionalidades futuras abaixo ainda não estão implementadas. Marca confirmada por Gabriel: **Millennium**.

## 1. Por que este produto existe

Gabriel trabalha na indústria, estuda e tem pouco tempo para desenvolver software. Conhece a operação de uma fábrica: início de turno, ordens de trabalho, responsáveis, anomalias, qualidade e passagem de serviço. Quer usar essa experiência para aprender programação e construir produtos próprios.

O fluxo anterior com Ubuntu, tmux, papéis, provedores e exportação de TXT permitia trabalhar, mas exigia lembrar pastas e repetir a transferência de contexto. O fluxo atual no VS Code ainda não foi considerado utilizável pelo próprio Gabriel. Instalar ferramentas e passar testes de scripts não demonstra que o produto resolveu esse problema.

**Promessa pretendida:** abrir um projeto, entender onde parou, descrever uma tarefa, acompanhar a construção, conferir o resultado e terminar com uma próxima ação clara.

**Visão:** uma fábrica pessoal de software, com assistência de IA e aprendizado, acessível pelo notebook e, depois, pelo celular. Replit e v0 são referências de facilidade de começar, conversar e visualizar o resultado. Millennium precisa provar uma vantagem concreta em continuidade do trabalho e aprendizado antes de se tornar um serviço para outras pessoas.

## 2. Decisões e hipóteses

| Tema | Decisão ou hipótese |
| --- | --- |
| Marca | Millennium; identificadores novos usam `millennium` |
| Primeiro usuário | Gabriel, com pouco tempo e familiaridade inicial com Git, VS Code e desenvolvimento |
| Ambiente disponível | Windows, Ubuntu/WSL, VS Code e assistentes já instalados |
| Primeiro resultado | Uma tarefa real concluída, entendida e retomável pelo usuário |
| Produto público | Possibilidade futura, sem lançamento comercial decidido |
| Aprendizado | Faz parte do produto; cada entrega explica um conceito e permite uma ação manual pequena |
| Economia de tokens | Hipótese: medir uso por tarefa aceita, revisões, erros e tempo humano |
| Orquestração | Deve ser explícita, limitada e observável; múltiplos chats não equivalem a coordenação automática |
| Nome comercial | A grafia está escolhida; disponibilidade de marca, domínio e identificadores públicos não foi verificada |

## 3. O que existe hoje, com base na inspeção

- O código ativo fica em `~/ai-projects/gabbs-product-factory`, no Ubuntu.
- O setup pessoal fica em `C:\dev\fabrica`: iniciador, guias, prompts, workspaces, exportador e extensão privada do VS Code.
- Lead, frontend, backend e database são contextos/pastas de trabalho. O guia atual informa que não se coordenam sozinhos.
- Há uma landing estática em `landing/`, feita com Vite, TypeScript, GSAP e testes Playwright.
- Há uma aplicação experimental Next.js com Supabase/PostgreSQL e código de checkout Stripe. Ela não é a interface operacional da fábrica nem comprova um gateway pronto.
- Os testes existentes de exportação são evidência técnica; não são evidência de que Gabriel concluiu um turno sozinho.
- A cópia em `C:\dev\fabrica\web` tem alterações próprias. Não deve ser sobrescrita pela pasta principal.
- Existem alterações anteriores em README, workflows, dependências e webhook; a transição deve preservá-las.

## 4. Experiência de um turno

1. **Abrir:** ver projeto, último turno, pendências, bloqueios e próxima ação. A escolha de pastas é feita no cadastro do projeto e lembrada depois.
2. **Planejar:** descrever uma ordem de trabalho em português. A IA propõe um objetivo, escopo pequeno, critério de aceite e forma de testar.
3. **Executar:** escolher o assistente disponível. Um executor trabalha no projeto; a interface mostra estado, arquivos envolvidos e ações que aguardam decisão.
4. **Conferir:** abrir o resultado, ver as diferenças do código e os testes. O revisor recebe o objetivo, as alterações e as evidências necessárias.
5. **Corrigir:** transformar achados em instruções específicas e executar outra tentativa identificada. Limites de tentativas evitam ciclos indefinidos.
6. **Aprender:** mostrar o que mudou, por que mudou e um exercício pequeno relacionado ao resultado. Gabriel precisa conseguir explicar a mudança com suas palavras.
7. **Encerrar:** registrar concluído, pendente, anomalias, evidências, arquivos alterados e a primeira ação do próximo turno.

### Vocabulário

| Fábrica | Millennium |
| --- | --- |
| Turno | Sessão de trabalho com abertura e fechamento |
| Ordem de trabalho | Tarefa com critério de aceite |
| Responsável | Pessoa ou agente que executa uma etapa |
| Anomalia | Erro, teste falhando ou impedimento registrado |
| Controle de qualidade | Revisão do código e validação do resultado |
| Passagem de serviço | Estado salvo que permite continuar outro dia |

Usar linguagem familiar sem transformar o aprendizado em mais formulários obrigatórios. Informações que o sistema consegue observar devem ser preenchidas automaticamente e revisáveis.

## 5. Primeiro fluxo utilizável

### Etapa A: validar o trabalho pessoal no ambiente existente

- Uma entrada chamada Millennium abre o contexto principal no VS Code.
- Um guia curto mostra somente abrir, conversar, conferir e encerrar.
- O projeto, o assistente e o objetivo ficam claros antes da execução.
- O fluxo começa com um executor e uma revisão delimitada. Os quatro papéis ficam disponíveis quando a tarefa realmente exigir.
- O TXT continua como evidência e opção de transferência. Reenviar a conversa inteira não é requisito para toda etapa.
- O fechamento registra uma passagem de turno em arquivo do projeto, sem depender da memória deste chat.
- Instalar uma extensão, autenticar uma conta ou exibir um menu são verificações parciais, não o aceite desta etapa.

### Etapa B: interface local do Millennium

Proposta após a validação da etapa A: uma interface no navegador com projetos, turno atual, conversa, resultado, revisão e histórico. O VS Code continua disponível para aprender e inspecionar o código.

A primeira tela deve permitir abrir o projeto recente e continuar sua tarefa. Dentro do projeto, haverá um espaço de trabalho com conversa, prévia quando aplicável, alterações de arquivos e estado da execução. Uma tela de preferências mostra os provedores realmente disponíveis, sem oferecer integrações fictícias.

Uma landing page apresenta o produto e aponta para o repositório. Ela permanece separada da interface que executa tarefas. O experimento anterior do Studio não será reativado apenas por mudar o nome; deve ser avaliado contra esta SPEC.

### Etapa C: acesso pelo celular e produto para terceiros

- O celular acessa uma interface autenticada; a execução ocorre num computador ou serviço disponível, não no navegador do telefone.
- Uma instância local depende de o computador estar ligado. Serviço hospedado exige orçamento, execução isolada, autenticação, armazenamento, fila, recuperação de falhas e gestão de segredos.
- Antes de oferecer a terceiros, validar isolamento entre usuários, restauração de projetos, limites de consumo e suporte.
- Assinaturas pessoais de ferramentas não serão tratadas como uma API pública ou como autorização para revenda de acesso. O modelo de integração e os termos do provedor precisam ser verificados na fase de hospedagem.

## 6. Contrato mínimo de execução

Cada execução terá `project_id`, `turn_id`, `task_id`, `attempt_id`, provedor, modelo efetivamente usado, objetivo, início/fim, estado e referências às evidências.

Estados de tarefa: `planejada`, `executando`, `aguardando_usuario`, `em_revisao`, `precisa_correcao`, `concluida`, `bloqueada`, `cancelada` e `interrompida`. O turno pode estar `aberto`, `pausado` ou `encerrado`.

- Uma tarefa só chega a concluída depois do critério de aceite ser verificado. Texto otimista do agente não é prova.
- Uma pasta de trabalho não recebe duas execuções de escrita concorrentes. Paralelismo exige isolamento e integração explícita.
- Parar deve cancelar o trabalho em andamento e registrar o ponto de interrupção.
- Reabrir uma tarefa interrompida não repete automaticamente comandos nem ações externas.
- O primeiro protótipo propõe no máximo duas rodadas automáticas de correção, configuráveis; ao atingir o limite, apresenta achados e aguarda decisão.
- Publicação, cobrança real e ações externas com consequências recebem uma confirmação contextual. Rotinas locais já autorizadas não pedem a mesma confirmação repetidamente.
- Logs ficam disponíveis integralmente na medida em que o provedor os fornece. Truncamentos e registros incompletos são identificados.
- O contexto enviado ao revisor contém tarefa, diff, testes e achados relevantes, com acesso aos registros completos quando necessário.
- Se o provedor não informar tokens/custo, o campo mostra indisponível. Nenhuma estimativa será apresentada como medição.

## 7. Arquitetura proposta, sujeita à validação

| Componente | Direção |
| --- | --- |
| Interface | Reaproveitar TypeScript e React/Next.js onde reduzir trabalho; tema escuro, organização clara, bom uso por teclado e celular |
| Executor local | Processo Node que chama uma integração documentada do assistente, acompanha saída e permite cancelamento |
| API | Começar pelas capacidades existentes; adicionar Fastify somente se a separação do executor exigir um serviço próprio |
| Dados de operação | Avaliar SQLite para projetos, turnos e tentativas locais; segredos ficam fora do banco de histórico |
| Artefatos | Arquivos, diffs, testes, exportações e relatórios associados à tentativa |
| Versionamento | Git com mudanças revisáveis e recuperação; preservação de arquivos ainda não commitados |
| Provedores | Adaptadores com capacidades declaradas: autenticação, execução, retomada, cancelamento e métricas |
| Infraestrutura | Primeiro local; hospedagem e acesso remoto entram com requisitos e orçamento próprios |

Não é preciso dominar C#, PHP, Node e todas as nuvens ao mesmo tempo. A primeira trilha usa a stack existente e conceitos transferíveis: variáveis, funções, dados, HTTP, SQL, testes e Git. Uma linguagem exigida por uma vaga pode entrar depois numa tarefa específica.

## 8. Projeto de aprendizagem sugerido: Diário de Turno

Este é um projeto de exercício construído com o Millennium, separado do mecanismo que executa os agentes.

Primeira entrega: criar um turno fictício, registrar uma anomalia com estado aberto/resolvido, listar registros, encerrar com uma passagem de serviço e reabrir a página mantendo os dados. Usar dados inventados, sem documentos ou informações internas do empregador.

Aprendizado em entregas pequenas:

1. Abrir o repositório, localizar um componente e usar `git status`/diff para entender uma mudança.
2. Fazer um formulário com validação de campo obrigatório e explicar entrada, estado e erro.
3. Criar uma API simples e entender requisição, resposta e códigos HTTP.
4. Persistir dados e entender tabela, identificador e consulta.
5. Testar um campo vazio, um registro válido e a recuperação após recarregar.
6. Revisar uma alteração, fazer um commit e explicar como recuperá-la.

Aceite do exercício: Gabriel percorre o fluxo, provoca um erro de validação, reconhece o arquivo alterado e explica por que o teste passou.

## 9. Gateway de pagamentos: uma aplicação futura

O interesse em pagamentos permanece no roadmap, como produto separado desenvolvido com o Millennium. A hipótese comercial é ajudar um segmento específico de comerciantes de Ponta Grossa a cobrar e acompanhar pagamentos com facilidade e atendimento próximo.

Primeiro investigar com comerciantes: que problema permanece apesar das soluções existentes, frequência, volume, ticket, taxas contratadas, conciliação, estornos e disposição de pagar. Não assumir ausência de concorrência local apenas pela ausência de escritórios físicos.

Primeira prova técnica proposta: cadastro de um vendedor fictício, criação de cobrança Pix em sandbox de um provedor, QR Code, consulta de estado, webhook autenticado, idempotência, conciliação e tratamento de falha. Não movimentar dinheiro real nesta prova.

Pix, carteiras como Apple Pay e redes de cartão são integrações com papéis diferentes. Cripto e a referência a Polymarket exigem descoberta separada; não entram como simples meios adicionais de pagamento no primeiro exercício.

R$ 1 por transação é uma hipótese a testar. A conta inclui custo do parceiro, infraestrutura, suporte, impostos e perdas aplicáveis; uma tarifa de serviço não substitui automaticamente a tarifa do meio de pagamento. A classificação regulatória depende da atividade e do fluxo do dinheiro. Integrar um PSP não equivale a abrir um banco, nem elimina por si só obrigações legais e contratuais.

Antes de operação real, selecionar parceiros e revisar o modelo com profissionais competentes, incluindo obrigações de identificação de clientes, proteção de dados e tratamento de incidentes. A Resolução BCB 494/2025 alterou regras de autorização; não usar FAQs antigas como critério suficiente para lançar o serviço.

## 10. Critérios de aceite e evidências

| Critério | Evidência necessária |
| --- | --- |
| Entrar no trabalho em até 2 minutos após instalação | Observação de Gabriel abrindo e reconhecendo o projeto sem buscar caminhos |
| Concluir uma ordem pequena em uma sessão de até 30 minutos | Objetivo, resultado aberto, teste e revisão registrados; alvo inicial, não garantia |
| Retomar no dia seguinte | Mostrar pendência e próxima ação sem reconstruir o contexto por conversa |
| Parar e recuperar | Ensaio de cancelamento/interrupção com estado e arquivos preservados |
| Falha de acesso do provedor | Mensagem acionável e tarefa preservada, sem estado falso de execução |
| Aprender | Gabriel explica uma mudança e executa uma verificação manual |
| Revisão útil | Um defeito introduzido num exercício é encontrado, corrigido e coberto por um teste pertinente |
| Medir eficiência | Comparar ao fluxo manual ao menos 3 tarefas equivalentes: tempo humano, uso informado, rodadas e retrabalho |
| Usabilidade da futura interface | Verificar teclado e telas de 360px/1440px com conversa, resultado e ações legíveis |
| Publicação honesta | Landing e README distinguem recursos disponíveis, protótipos e roadmap |

## 11. Ordem de implementação

1. Aplicar Millennium às superfícies ativas e criar backup dos arquivos alterados. Manter identificadores antigos quando necessários à compatibilidade e registrar a migração.
2. Validar um turno pessoal no VS Code com o guia e o projeto de aprendizagem. Corrigir o que impedir Gabriel de operar.
3. Implementar armazenamento de turnos e tentativas, execução, cancelamento e revisão com testes do contrato.
4. Implementar a interface local de conversa, resultado e retomada usando execuções reais.
5. Medir o fluxo e observar o uso antes de adicionar mais agentes, provedores ou infraestrutura.
6. Projetar acesso remoto autenticado e hospedagem se o uso pelo celular justificar o custo.
7. Pesquisar e prototipar a aplicação de pagamentos em sandbox, com escopo próprio.

## 12. Referências e decisões pendentes

- [v0: documentação do produto](https://v0.app/docs): referência de experiência; não compromisso de reproduzir todos os serviços.
- [Replit: apresentação da plataforma](https://docs.replit.com/welcome): referência de ambiente de construção e execução.
- [Banco Central: Pix Cobrança](https://www.bcb.gov.br/estabilidadefinanceira/pix-cobranca).
- [Banco Central: Resolução BCB 494/2025](https://bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=494&tipo=Resolu%C3%A7%C3%A3o+BCB).

Referências enviadas e incorporadas em 1 de outubro:

- [v0.app](https://v0.app/): a referência explícita de Gabriel para começar por uma conversa, acompanhar uma prévia, iterar e manter o código no GitHub. No Millennium, abertura e passagem de turno complementam essa experiência.
- Arte enviada com a marca Millennium e a frase sobre velocidade do Pix: referência visual e de visão para a aplicação de pagamentos. Contraste, tipografia limpa e sensação de movimento podem orientar a identidade; Pix, cartão, cripto, baixa latência e custo mínimo na imagem ainda não são capacidades comprovadas do projeto.
- A preferência por uma interface escura orienta o espaço de trabalho. A peça clara enviada é referência, não uma ordem para mudar todo o tema nem uma tela operacional.

A arquitetura de marca adotada nesta SPEC mantém Millennium como a fábrica de software solicitada. O gateway é um produto futuro construído com ela; seu nome comercial definitivo pode ser decidido separadamente.

Ainda faltam uma sessão observada de uso, o orçamento de hospedagem/modelos e a confirmação do primeiro segmento de comerciantes. Estas decisões não impedem a renomeação nem a validação pessoal.
