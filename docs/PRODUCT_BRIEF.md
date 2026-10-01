# Millennium: direção do produto

Uma fábrica pessoal de software para construir com IA, compreender as mudanças e continuar o trabalho no próximo turno.

[SPEC e critérios de aceite](MILLENNIUM_SPEC.md) · [Primeiro turno](PRIMEIRO_TURNO.md) · [Roadmap](ROADMAP.md)

## Para quem começamos

Uma pessoa com pouco tempo, em aprendizado de programação, que precisa transformar uma ideia em tarefas verificáveis sem administrar várias pastas, terminais e conversas manualmente. O primeiro usuário é Gabriel. O uso por outras pessoas é uma hipótese posterior, não um serviço já disponível.

## O problema

O fluxo manual permite executar tarefas, mas obriga a escolher diretórios, iniciar agentes, copiar respostas, pedir revisão em outro chat e reconstruir o contexto ao voltar. O setup no VS Code reduz alguns passos, mas ainda precisa ser validado pelo próprio usuário.

## Experiência pretendida

1. Abrir um projeto e reconhecer onde o trabalho parou.
2. Definir uma ordem de trabalho pequena, com resultado e teste claros.
3. Acompanhar uma execução e consultar seus arquivos e evidências.
4. Revisar o resultado e corrigir problemas confirmados.
5. Entender uma mudança importante e fazer uma verificação manual.
6. Encerrar com uma passagem de turno e uma próxima ação.

A conversa e a prévia do resultado são referências de experiência de Replit e v0. Turnos, anomalias, revisão e aprendizado organizam o trabalho no Millennium. Isso não implica que já exista uma interface própria com essas funções.

## Limite entre presente e futuro

| Hoje | Próximas etapas, ainda não entregues |
| --- | --- |
| Setup pessoal no VS Code/WSL e assistentes externos | Interface própria de conversa, prévia e retomada |
| Papéis em pastas separadas, coordenados pela pessoa | Executor com estados persistidos, cancelamento e recuperação |
| Exportação de registros para auditoria | Revisão automatizada com tentativas limitadas |
| Landing estática de apresentação | Acesso remoto autenticado pelo celular |
| Guias e passagem de turno em Markdown | Produto hospedado para terceiros |

O código Next.js/Supabase/Stripe existente é um experimento anterior. Não é a interface operacional da fábrica, não é um gateway pronto e não define o MVP atual.

## Primeiro aceite

Gabriel precisa concluir uma tarefa pequena, abrir o resultado, explicar uma mudança e retomar depois pela passagem de turno. A instalação das ferramentas e testes técnicos são pré-requisitos, não o aceite de usabilidade.

O exercício sugerido é um **Diário de Turno**, usando dados fictícios. A escolha da primeira tarefa deve caber no tempo disponível; o exercício completo não precisa ser feito numa sessão.

## Modelo de negócio e pagamentos

Primeiro validar utilidade pessoal. Distribuição, preço e eventual abertura do código serão decisões posteriores. Não há assinatura comercial definida nem economia de tokens comprovada.

O gateway de pagamentos é uma aplicação futura que poderá ser construída com o Millennium. A descoberta comercial e o protótipo em sandbox têm escopo separado na SPEC; não fazem parte do aceite do primeiro turno.

## Histórico

A direção anterior de plataforma de conteúdo pago está preservada em [histórico](history/previous-product-direction/README.md). Seus checklists não são ordens atuais de implementação.
