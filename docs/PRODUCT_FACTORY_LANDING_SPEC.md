# SPEC: Landing page do Gabbs Product Factory

**Status:** Implementação em validação; copy e visual ainda podem ser revisados<br>
**Data:** 2026-09-27<br>
**Escopo:** Página pública de apresentação do repositório

## 1. Contexto

O Gabbs Product Factory é um setup pessoal de desenvolvimento assistido por IA, operado no VS Code. A pessoa define uma tarefa, trabalha com um agente no contexto do projeto, revisa o resultado e pode exportar a conversa para auditoria e continuidade.

A página pública deve explicar essa proposta e levar a pessoa interessada ao repositório. Ela não é a fábrica em si. O fluxo de trabalho e seu estado atual estão descritos no [README](../README.md), no [guia de operação](OPERATING_SYSTEM.md) e na [validação do fluxo](WORKFLOW_VALIDATION.md).

## 2. Objetivo

Apresentar de forma clara e visualmente atraente o que é o Gabbs Product Factory, como o processo pessoal funciona e onde consultar o código no GitHub.

**Ação principal:** visitar `https://github.com/gabbswq/gabbs-product-factory`.

**Público inicial:** pessoas curiosas sobre desenvolvimento de produtos com assistência de IA, especialmente quem quer entender um fluxo supervisionado dentro de um editor de código. A página não deve sugerir que esse processo local já é um produto hospedado ou pronto para instalação pública.

## 3. Mensagem e conteúdo

### 3.1 Direção de texto

- Idioma principal: português do Brasil.
- Explicar que a Factory organiza um processo de trabalho no VS Code; não é um SaaS nem um chat próprio.
- Descrever o ciclo sem prometer autonomia ou resultados não validados: ideia e escopo → tarefa para o agente no editor → revisão do resultado → próximo prompt e validação.
- Tratar os papéis Lead, Frontend, Backend e Database como contextos de trabalho separados, não como agentes que colaboram automaticamente.
- Distinguir o setup pessoal privado do código experimental disponível no repositório.

### 3.2 Estrutura proposta

1. **Cabeçalho:** nome/identidade do projeto e navegação curta para Processo e GitHub.
2. **Abertura:** frase curta explicando a proposta, uma linha de apoio e CTA principal para o repositório. “Da ideia ao sistema” pode ser avaliada como manchete, não é texto final aprovado.
3. **Processo:** representação simples das etapas de trabalho, incluindo revisão humana. Tornar evidente que o agente trabalha dentro do editor e que a decisão permanece com a pessoa.
4. **Limites e estado real:** nota concisa de que é um fluxo pessoal, que os papéis não se coordenam automaticamente e que recursos/provedores variam conforme o setup local.
5. **Fechamento:** repetir o link do GitHub e usar um rodapé discreto.

O conteúdo final e a redação da abertura permanecem sujeitos à revisão do Gabriel antes da publicação.

## 4. Direção visual e interação

- Visual escuro, editorial e tipográfico, com acabamento minimalista inspirado na Apple, texto claro e laranja como cor de acento; manter a identidade já usada no projeto sem reproduzir literalmente outro site.
- Usar [ponytail.dev](https://ponytail.dev/) como referência de atmosfera, tipografia e simplicidade, não como fonte de cópia, layout exato ou ativos.
- Priorizar uma abertura forte e legível, seguida de conteúdo compacto e bem hierarquizado. Evitar espaçamento vazio excessivo, grade de cards genérica e elementos decorativos sem função.
- Usar GSAP para movimento sutil ligado à leitura/rolagem, desde que a implementação permaneça leve, não atrase o conteúdo principal e tenha fallback sem JavaScript.
- Respeitar `prefers-reduced-motion`; manter conteúdo e navegação funcionais sem animação.
- Garantir navegação por teclado, foco visível, contraste adequado e layout sem rolagem horizontal em telas pequenas.

## 5. Fora de escopo

- Chat com LLM, geração ou edição de código no navegador.
- Clone do Replit, IDE web, terminal web, workspace hospedado ou execução de projetos.
- Cadastro, login, contas, cobrança, planos, gateway de pagamento ou painel de usuário.
- Banco de dados para a landing page, incluindo MySQL, Supabase ou PostgreSQL.
- Orquestração autônoma de múltiplos agentes, promessas de economia de tokens ou disponibilidade 24 horas.
- Migrar ou reestruturar o aplicativo experimental de produtos, checkout ou banco de dados.
- MySQL: a landing não precisa de banco. Não migrar o código experimental de Supabase/PostgreSQL sem uma SPEC específica.
- Publicar alterações no GitHub ou fazer deploy sem revisão explícita do conteúdo final.

## 6. Implementação e limites técnicos

- Auditar a landing de Next.js já existente e preservar o trabalho local. O app Next também contém APIs e rotas dinâmicas, portanto não presumir que todo ele possa ser exportado para GitHub Pages.
- Manter a landing pública em um diretório estático isolado no mesmo repositório e publicar somente esse artefato pelo GitHub Pages. Não alterar nem remover as rotas do app experimental para viabilizar a publicação.
- Evitar dependências no runtime da página; GSAP pode ser usado no build e entregue em bundle estático. Conteúdo principal e CTA devem continuar disponíveis sem animação.
- O endereço público pretendido é `https://gabbswq.github.io/gabbs-product-factory/`; configurar o link de entrada no README e no campo Website do repositório quando a publicação estiver ativa.
- O CTA do GitHub deve apontar exatamente para `https://github.com/gabbswq/gabbs-product-factory`.
- Não confundir essa página pública com o setup local e privado do VS Code descrito no README do repositório principal.

## 7. Critérios de aceite

- [x] A primeira tela identifica Gabbs Product Factory e explica, em linguagem direta, que é um fluxo de trabalho com IA dentro do VS Code.
- [x] Há um CTA visível que abre o repositório GitHub correto.
- [x] A página mostra o ciclo ideia → agente no editor → revisão → próxima iteração, sem sugerir colaboração automática entre os quatro papéis.
- [x] Não há chat, login, formulário, checkout, banco de dados ou funcionalidade de construção de software no navegador.
- [x] Afirmações sobre provedores, automação, disponibilidade e estado do produto correspondem à documentação atual.
- [x] Layout funciona em desktop e celular, sem conteúdo cortado ou rolagem horizontal.
- [x] Links e controles são utilizáveis por teclado e têm foco visível; conteúdo continua utilizável com movimento reduzido.
- [x] O fluxo de desenvolvimento local pelo terminal integrado do VS Code é verificado e documentado com o comando e URL que realmente funcionarem.
- [x] Verificações apropriadas da stack existente (incluindo build) passam antes da publicação.
- [x] O resultado visual é revisado em navegador em pelo menos uma largura desktop e uma largura móvel antes de qualquer publicação.
- [x] A landing é gerada como site estático e o fluxo de publicação do GitHub Pages publica apenas esse diretório.
- [x] Testes de navegador verificam conteúdo principal, destino do CTA, links, console sem erros e layout móvel; verificações automatizadas de acessibilidade e peso do bundle são executadas.
- [ ] URL do GitHub Pages responde publicamente e aparece no README e no campo Website do repositório.

## 8. Decisões em aberto

1. **Texto final da abertura:** “Da ideia ao sistema” fica como primeira proposta de copy, sujeita à revisão visual.
2. **Demonstração visual:** usar representação própria do fluxo/editor, evitando publicar capturas que possam conter informação pessoal do computador.
3. **MySQL:** não faz parte da landing. O app experimental usa Supabase/PostgreSQL; qualquer troca de banco é outra decisão e exige SPEC separada.

## 9. Sequência proposta

1. Auditar a landing existente e registrar diferenças sem apagar mudanças preexistentes. **Concluído.**
2. Implementar a landing estática, testes e guia para executar no VS Code/WSL. **Concluído.**
3. Mostrar a prévia local e validar os critérios em desktop e celular. **Concluído; aguardando comentários do Gabriel sobre direção visual e copy.**
4. Revisar o conteúdo e o diff antes de publicar. **Em andamento.**
5. Ativar GitHub Pages, adicionar o link público ao GitHub e validar a URL.
