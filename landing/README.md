# Landing do Millennium

A landing é um site estático independente do app Next.js experimental. Isso permite publicar só a apresentação no GitHub Pages sem exportar APIs ou telas dinâmicas do app.

## Abrir no VS Code

1. No VS Code, confira **WSL: Ubuntu** no canto inferior esquerdo.
2. Use **Arquivo > Abrir Pasta** e abra a pasta do projeto ativo (`~/ai-projects/gabbs-product-factory` no setup pessoal).
3. Abra **Terminal > Executar Tarefa...** e escolha **Millennium: instalar landing** uma vez.
4. Escolha **Millennium: iniciar landing**. Abra a URL local que aparecer no terminal.
5. Para executar os testes, escolha **Millennium: validar landing**. Na primeira vez, instale o Chromium com a tarefa **Millennium: instalar navegador de testes**.

Para executar a partir da raiz do repositório, sem trocar de pasta:

```sh
npm --prefix landing ci
npm --prefix landing run dev
```

## Validar antes de publicar

```sh
npm ci
npx playwright install chromium
npm run verify
npm run measure:public
```

Os testes conferem a mensagem e o CTA do GitHub, navegação interna, ausência de formulário e chamadas externas, erros de JavaScript, responsividade em desktop/celular, suporte a movimento reduzido e acessibilidade automatizada com axe. O teste de bundle limita o JavaScript comprimido a 150 KiB. `measure:public` mede TTFB, FCP, LCP e tempo de carregamento no endereço publicado. A landing não carrega fonte nem outros recursos de terceiros no caminho crítico.

## Publicação

O build gera arquivos estáticos em `dist/`. O workflow do GitHub Pages publica apenas esse diretório em `https://gabbswq.github.io/millennium/`. O restante do app Next.js não é incluído nesse deploy.
