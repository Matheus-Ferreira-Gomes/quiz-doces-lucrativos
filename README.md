# Quiz Doces Lucrativos

Quiz de 5 perguntas que fica entre o seu anúncio (Meta Ads) e o link da sua
campanha. A pessoa clica no anúncio, responde as perguntas, e no final é
levada para o seu link, já carregando todos os dados de rastreamento que
chegaram na URL (fbclid, utm_*, etc).

Este guia é para quem **não é programador**. Siga os passos na ordem.

---

## 1. Como editar o link da campanha (o mais importante)

1. Abra o arquivo `config.js`.
2. Encontre a linha:
   ```js
   redirectUrl: "https://COLE-AQUI-O-LINK-DA-CAMPANHA",
   ```
3. Troque o texto entre aspas pelo link de verdade (WhatsApp, página de
   vendas etc). Exemplo:
   ```js
   redirectUrl: "https://wa.me/5511999999999",
   ```
4. Salve o arquivo.
5. Se o site já estiver publicado no GitHub, você precisa "subir" essa
   mudança (commit + push — veja a seção 5 deste README).

Enquanto esse campo estiver com o texto de exemplo, a página final mostra um
aviso (só quando você abre com `?debug=1` na URL) e **não tenta redirecionar**
para não quebrar a experiência de quem está testando.

### Outros campos do `config.js`

- `buttonText`: o texto do botão final (ex: "Falar agora no WhatsApp").
- `metaPixelId`: se você só tem o número do Pixel do Facebook, cole aqui
  (só os números). Deixe `""` se não for usar.
- `sendAnswersInUrl`: deixe `true` para que as respostas do quiz
  (q1 a q5 e a "temperatura" do lead) sejam enviadas junto no link final.
- `webhookUrl`: se você usa alguma automação (n8n, Make, etc) que recebe os
  dados do lead, cole a URL dela aqui. Senão, deixe `""`.

---

## 2. Como colar o Pixel do Facebook

Você pode escolher **uma das duas formas**:

### Forma simples — só o ID
No `config.js`, preencha:
```js
metaPixelId: "123456789012345",
```
O quiz carrega o pixel sozinho.

### Forma avançada — colar o código completo
Se você copiou o "código base do pixel" direto do Gerenciador de Eventos da
Meta (aquele bloco grande de `<script>`), abra o arquivo `index.html` e
procure por:
```html
<!-- ===== COLE AQUI O CÓDIGO DO PIXEL DO FACEBOOK (opcional) ===== -->
<!-- ===== FIM DO PIXEL ===== -->
```
Cole o código entre essas duas linhas. Nesse caso, **não precisa** preencher
o `metaPixelId` no `config.js` (se preencher os dois, o quiz detecta que o
pixel já existe e não duplica nada).

---

## 3. Como colar a meta tag de verificação de domínio da Meta

Isso é opcional e só é necessário se você for verificar o domínio no
Gerenciador de Negócios da Meta (normalmente feito na Etapa 3, com domínio
próprio).

1. No Gerenciador de Negócios, copie a tag `<meta ...>` que a Meta fornece.
2. Abra `index.html` e procure por:
   ```html
   <!-- ===== COLE AQUI A META TAG DE VERIFICAÇÃO DE DOMÍNIO DA META (opcional) ===== -->
   <!-- ===== FIM DA VERIFICAÇÃO ===== -->
   ```
3. Cole a tag entre essas duas linhas, salve, e suba a alteração (commit + push).
4. Volte ao Gerenciador de Negócios e clique em "Verificar".

---

## 4. Como testar no seu computador antes de publicar

Se você tiver Python instalado, dentro da pasta do site rode:
```
python -m http.server 8000
```
E abra no navegador: `http://localhost:8000/`

Para testar com rastreamento e o painel de debug, use:
```
http://localhost:8000/?fbclid=TESTE123&utm_source=facebook&utm_campaign=teste&ad_id=999&debug=1
```
Com `?debug=1` aparece um painel no rodapé mostrando todos os dados
capturados e a URL final que seria usada — sem redirecionar de verdade.

---

## 5. Como publicar as alterações (depois que o site já estiver no GitHub)

Se você não sabe usar linha de comando, o jeito mais simples é:

1. Acesse o repositório no site do GitHub (github.com).
2. Clique no arquivo que você quer mudar (ex: `config.js`).
3. Clique no ícone de lápis (editar).
4. Faça a alteração.
5. Role até o final da página e clique em **"Commit changes"**.
6. Em 1 ou 2 minutos, o site publicado já estará atualizado.

---

## 6. Trocar as imagens

As imagens de exemplo estão na pasta `images/`:
- `hero-doces.webp` — imagem da tela inicial.
- `og-image.webp` — imagem que aparece quando o link é compartilhado.

Troque pelos seus arquivos **mantendo os mesmos nomes**, ou, se usar nomes
diferentes, atualize as referências no `index.html`. Prefira o formato
`.webp` para o site continuar rápido.

---

## Estrutura dos arquivos

- `index.html` — estrutura das telas do quiz.
- `style.css` — visual (cores, fontes, layout).
- `config.js` — **o único arquivo que você normalmente precisa editar**.
- `app.js` — lógica do quiz, rastreamento e pixel (não precisa editar).
- `images/` — imagens usadas no quiz.
- `404.html` — página exibida quando um link não existe.
- `.nojekyll` — arquivo técnico para o GitHub Pages funcionar corretamente.
