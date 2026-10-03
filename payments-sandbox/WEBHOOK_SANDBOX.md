# Webhook externo: roteiro de homologacao

O receptor separado esta implementado e testado localmente. **Ainda nao houve
entrega Asaas real nem abertura de tunnel.** Esta etapa depende de uma conta
Sandbox escolhida por Gabriel, credenciais inseridas no terminal e autorizacao
expressa antes de qualquer exposicao HTTPS. Nao usar producao ou dados pessoais.

## Duas portas, um registro

```text
Navegador local -> 127.0.0.1:4311 -> painel/API protegidos por Host e CSRF
                                          |
                              mesmo registro privado
                                          |
Asaas Sandbox -> HTTPS futuro -> 127.0.0.1:4312 -> POST /webhooks/asaas
```

O segundo listener nao tem painel, assets, sessao, lista de cobrancas ou
criacao de pagamentos. Aceita somente eventos servidor a servidor, autentica
`asaas-access-token` antes do JSON, limita o corpo e aplica o mesmo contrato de
valor/cliente/referencia/idempotencia do listener local. GET na raiz retorna
404: nao e uma pagina que deve abrir no navegador.

Nenhum listener escuta em 0.0.0.0. O HTTPS termina no futuro proxy/tunnel,
nao neste servidor HTTP. Nao confiar em headers de proxy para identificar IP
do Asaas; esta prova usa autenticacao por token, nao uma allowlist de IP.
Nao e uma arquitetura de producao nem tem garantia de disponibilidade.

## Preparar localmente

1. Siga [README.md](README.md#asaas-sandbox-etapa-separada) para obter uma
   chave Sandbox e um comprador ficticio. Insira chave, ID e token separado
   no terminal Bash. Nao envie segredos ao chat nem grave arquivos `.env`.
2. Na raiz do repositorio, com as variaveis exportadas nesse mesmo terminal:

```sh
npm run pix:dev -- --asaas --webhook-port 4312
```

3. Confira as duas URLs no terminal. O painel pode escolher outra porta se
   4311 estiver ocupada; o receptor 4312 **nao faz fallback**. Se 4312 estiver
   ocupada, o inicio falha e preserva o outro servidor. Escolha outra porta
   explicitamente e use exatamente essa porta no futuro tunnel.
4. O simulador nao aceita `--webhook-port`. Nenhuma acao de pagamento acontece
   apenas por iniciar os listeners.

## HTTPS temporario: somente depois de autorizacao

Com o receptor local confirmado e `cloudflared` instalado/verificado, uma
possibilidade para homologacao e um Quick Tunnel da Cloudflare. O comando
abaixo e um roteiro futuro, **nao foi executado**:

```sh
cloudflared tunnel --url http://127.0.0.1:4312
```

Nunca aponte para a porta do painel. Nao substitua a verificacao de Host/CSRF
por `trustProxy: true`, nem reescreva headers para expor a API local.
Anote a URL HTTPS impressa. O hostname temporario muda ao reiniciar o tunnel
e nao tem garantia de uptime. Nao use um desafio de login/PIN por email nesse
callback: o provedor faz uma chamada nao interativa.

Antes de cadastrar a URL no provedor, confirme via cliente HTTP que `/`,
`/api/session` e `/api/charges` retornam 404 e nao devolvem dados. Se algum
desses caminhos apresentar painel ou registros, pare o tunnel: ele esta
apontando para a superficie errada. POST sem token deve retornar 401.

## Fluxo no Asaas Sandbox

1. Crie um webhook dedicado a este laboratorio na **conta Sandbox**, seguindo
   a [configuracao oficial](https://docs.asaas.com/docs/create-new-webhook-via-web-application).
   URL: HTTPS impressa pelo tunnel mais `/webhooks/asaas`. Configure o token
   separado, correspondente ao ambiente do servidor. Nao use a API key como token.
2. Selecione apenas os eventos suportados: `PAYMENT_CREATED`, `PAYMENT_CONFIRMED`,
   `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`.
   Eventos nao suportados ficam registrados como ignorados, nao como recebimento.
3. No painel local em modo Asaas Sandbox, crie uma cobranca ficticia por Pix
   e confira o QR e o ID. Nenhuma chave de API passa pelo navegador.
4. Localize essa mesma cobranca no Sandbox do Asaas. Confirme o pagamento pelo
   controle de simulacao disponivel na interface do provedor, conforme o
   [guia oficial](https://docs.asaas.com/docs/como-adicionar-dinheiro-para-testes).
   Nao use um aplicativo bancario real para pagar o QR.
5. Confira a aba Eventos no Millennium e os logs de entrega no Asaas. Compare
   o ID do evento, o pagamento, o valor e o HTTP de resposta. Apenas um registro
   local marcado como recebido nao prova que foi o provedor que enviou o evento.
6. Use Conciliar no Millennium e compare o estado consultado com o recebido
   por webhook. CONFIRMED nao conta como RECEIVED. Nao force um estado local
   nem envie um webhook manual de recebimento para fingir homologacao.

O ID externo esta em `providerId` no detalhe JSON de `/api/charges/<id-local>`;
o ID local esta na tela e foi enviado como `externalReference`. Use esses
identificadores para correlacionar registros, sem publicar os dados privados.

## Encerrar e tratar falhas

Pare o tunnel, desative apenas o webhook criado para este laboratorio e pare
o servidor com Ctrl+C. Depois remova as tres variaveis com o `unset` indicado
no README. Nao altere outros webhooks existentes na conta.

Ao fechar, o receptor drena requisicoes em andamento antes de liberar o lock
da pasta de dados. Persistencia com falha retorna erro, nao 200; o provedor
pode tentar novamente. Token errado, evento desconhecido, valor divergente e
criacao ainda incerta nao autorizam criar outra cobranca nem marcar aceite.
Verifique os logs e a fila do webhook antes de trocar URL, token ou tentar
outra decisao. Nao publique headers, screenshots de tokens ou payloads completos.

## Portoes de aceite

| Criterio | Evidencia exigida | Estado atual |
| --- | --- | --- |
| Contrato e isolamento locais | Testes de API e dois listeners TCP reais | Testado com fixtures |
| Integracao HTTP/navegador | Build e formulario/QR/estados/teclado em desktop/mobile | Testado localmente |
| Transporte HTTPS externo | Receptor alcançado pela URL autorizada, sem painel/API | Pendente |
| Cobranca e QR do provedor | Cobranca ficticia correspondente no Asaas, QR retornado | Pendente |
| Entrega externa de evento | Log Asaas e evento local correlacionados | Pendente |
| Conciliacao externa | Consulta do mesmo ID, sem novo POST, estado consistente | Pendente |
| Uso por Gabriel | Percorrer fluxo e explicar entrada/API/estado/teste | Pendente |

Nao marcar a meta completa com apenas os dois primeiros portoes verdes.
Para registrar evidencia externa, mantenha dados redigidos dentro de
`.payments-sandbox/`, fora do Git, sem credenciais ou dados pessoais.

Referencias verificadas em 3 de outubro de 2026:
[Asaas: eventos e seguranca](https://docs.asaas.com/docs/receive-asaas-events-at-your-webhook-endpoint),
[Fastify: encerramento de listeners](https://fastify.dev/docs/latest/Reference/Hooks/#preclose),
[Cloudflare: limites e operacao de Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
