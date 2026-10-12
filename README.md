# Quiz Doces Lucrativos

Quiz de 5 perguntas que fica entre o seu anúncio (Meta Ads) e o link da sua
campanha. A pessoa clica no anúncio, responde às perguntas e no final é
levada para o seu link, que recebe junto todos os dados de rastreamento que
vieram na URL (fbclid, utm_*, ids de campanha etc.).

Este guia é para quem **não é programador**. Na maioria das vezes você só vai
mexer em **um arquivo: `config.js`**.

---

## 1. Colar o link da campanha (o mais importante)

1. Abra o arquivo `config.js`.
2. Encontre a linha:
   ```js
   redirectUrl: "https://COLE-AQUI-O-LINK-DA-CAMPANHA",
   ```
3. Troque o texto entre aspas pelo seu link (WhatsApp, página de vendas,
   plataforma de atendimento...). Mantenha as aspas e a vírgula no final:
   ```js
   redirectUrl: "https://wa.me/5511999999999",
   ```
4. Salve e publique a alteração (seção 6).

**Pode deixar parâmetros no seu link** (ex.: `?origem=quiz`). O quiz não apaga
nada: se o mesmo parâmetro existir no seu link e na URL do anúncio, **o do seu
link vence**.

Enquanto o link estiver com o texto de exemplo, o botão final não leva a lugar
nenhum. No modo de teste (`?debug=1`) aparece um aviso vermelho lembrando você
de configurar.

### Os outros campos do `config.js`

| Campo | Para que serve |
|---|---|
| `buttonText` | Texto do botão final. |
| `metaPixelId` | Número do seu Pixel do Facebook (só números). Deixe `""` se não usar. |
| `sendAnswersInUrl` | `true` = manda as respostas (q1 a q5) e a `temperatura` no link final. `false` = não manda. |
| `webhookUrl` | Endereço de uma automação (n8n, Make, Zapier...) que recebe os dados do lead. Deixe `""` se não usar. |

---

## 2. O que vai no link final

Exemplo de como o link sai no final:

```
https://seu-link.com/?lead_id=DL-7K2Q9&fbc=fb.1.1712...&q1=renda_extra&...&temperatura=quente&fbclid=...&utm_source=facebook&utm_campaign=...
```

- **lead_id**: código único da pessoa (ex.: `DL-7K2Q9`). O mesmo código vai no
  evento Lead do pixel, para a Meta não contar a mesma conversão duas vezes.
- **fbc / fbp**: identificadores do Facebook, que melhoram a atribuição das vendas.
- **q1 a q5**: respostas do quiz.
- **temperatura**: `quente` (quer começar agora), `morno` (tem dúvidas) ou
  `frio` (só pesquisando).
- **Todos os parâmetros que vieram do anúncio** (fbclid, utm_*, campaign_id,
  adset_id, ad_id, ctwa_clid, gclid... qualquer um).

**Primeiro clique (first touch):** os parâmetros da primeira visita ficam
guardados no celular da pessoa. Se ela sair e voltar depois por outro caminho,
os dados originais continuam valendo.

---

## 3. Instalar o Pixel do Facebook

Escolha **uma** das duas formas.

**Forma simples, só pelo ID.** No `config.js`:
```js
metaPixelId: "123456789012345",
```

**Forma completa, colando o código.** Se você copiou o "código base" do pixel
no Gerenciador de Eventos (o bloco grande que começa com `<script>`), abra o
`index.html` e cole entre estas duas linhas:
```html
<!-- ===== COLE AQUI O CÓDIGO DO PIXEL DO FACEBOOK (opcional) ===== -->
<!-- ===== FIM DO PIXEL ===== -->
```
Se você fizer as duas coisas por engano, tudo bem: o quiz percebe e não duplica
nada.

**Eventos enviados para a Meta:**

| Evento | Quando |
|---|---|
| `PageView` | Ao abrir o quiz. |
| `QuizStart` (personalizado) | Ao tocar em "Começar agora". |
| `QuizStep` (personalizado) | A cada resposta, com o número da etapa e a resposta escolhida. |
| `QuizComplete` (personalizado) | Ao chegar na tela de resultado, com a temperatura. |
| `Lead` | Ao tocar no botão final, com a temperatura. |

Com esses eventos você pode, por exemplo, criar no Gerenciador de Anúncios
públicos de quem respondeu "quero começar agora" ou de quem terminou o quiz
mas não clicou no botão final.

---

## 4. Colar a meta tag de verificação de domínio da Meta

Só é necessário quando o quiz estiver no seu domínio próprio (Etapa 3).

1. No Gerenciador de Negócios da Meta, copie a tag `<meta ...>` fornecida.
2. No `index.html`, cole entre estas duas linhas:
   ```html
   <!-- ===== COLE AQUI A META TAG DE VERIFICAÇÃO DE DOMÍNIO DA META (opcional) ===== -->
   <!-- ===== FIM DA VERIFICAÇÃO ===== -->
   ```
3. Publique a alteração e clique em "Verificar" na Meta.

---

## 5. Testar (modo debug)

Coloque `?debug=1` no final do endereço do quiz, por exemplo:
```
http://localhost:8000/?fbclid=TESTE123&utm_source=facebook&utm_campaign=teste&ad_id=999&debug=1
```

Aparece uma barrinha escura no rodapé. Toque em **Expandir** para ver os
parâmetros capturados, fbc, fbp, lead_id, a forma como o pixel foi detectado,
os eventos disparados e a **URL final completa**. Nesse modo o botão final
**não redireciona**: ele só mostra a URL, e o botão **Copiar URL** copia o link.

- **Limpar dados**: apaga o que o quiz guardou no seu navegador, para você
  testar de novo como se fosse uma pessoa nova. Use sempre que for testar com
  outros parâmetros, porque o quiz guarda os da primeira visita.
- Atenção: no modo debug os eventos do pixel **são enviados de verdade**.
  Isso é útil para conferir na ferramenta "Testar eventos" da Meta, mas evite
  testar muito com o pixel de produção.

Para rodar no seu computador, abra o terminal na pasta do site e rode
`python -m http.server 8000`. Depois abra `http://localhost:8000/`.

---

## 6. Publicar alterações (depois que o site estiver no GitHub)

O jeito mais fácil, sem terminal:

1. Entre no repositório pelo site github.com.
2. Clique no arquivo (ex.: `config.js`) e depois no ícone de **lápis**.
3. Faça a alteração.
4. Clique em **Commit changes** e confirme.
5. Em 1 a 2 minutos o site publicado estará atualizado. Se não aparecer, abra
   numa aba anônima, porque o navegador pode estar mostrando a versão antiga.

---

## 7. Trocar as imagens

Na pasta `images/`:

- `hero-doces.webp`: foto da tela inicial. Use proporção 16:10, por exemplo
  1280×800 (pode ser menor). Formato **WebP** para manter o site rápido. Dá
  para converter grátis em squoosh.app.
- `og-image.jpg`: imagem que aparece quando o link é compartilhado no
  WhatsApp/Facebook. Tamanho **1200×630**, formato **JPG**.

Mantenha os mesmos nomes de arquivo e substitua os atuais.

---

## Arquivos do projeto

| Arquivo | O que é |
|---|---|
| `config.js` | **Suas configurações.** É o único que você precisa editar. |
| `index.html` | Estrutura das telas e os espaços para colar pixel e meta tag. |
| `style.css` | Visual: cores, fontes, tamanhos. |
| `app.js` | Lógica do quiz, rastreamento, pixel e webhook. Não precisa mexer. |
| `images/` | Imagens. |
| `404.html` | Página mostrada quando alguém acessa um endereço que não existe. |
| `.nojekyll` | Arquivo técnico vazio para o GitHub Pages. Não apague. |

Para mudar textos das perguntas, procure o trecho `QUESTIONS` no começo do
`app.js`. Altere só o texto entre aspas e mantenha as aspas e as vírgulas.
