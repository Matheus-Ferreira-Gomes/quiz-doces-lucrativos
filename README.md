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
4. Salve e publique a alteração (seção 7).

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
| `sendAnswersInUrl` | `true` = manda as respostas e a `temperatura` no link final. `false` = não manda. |
| `webhookUrl` | Endereço de uma automação (n8n, Make, Zapier...) que recebe os dados do lead. Deixe `""` se não usar. |

---

## 2. As perguntas: cada pessoa segue um caminho

A 1ª pergunta ("Você já vende doces hoje?") define o caminho. Assim ninguém
recebe pergunta que não faz sentido para o seu momento. Todos os caminhos
têm 5 perguntas.

| | Ainda não vende (`iniciante`) | Vende às vezes (`ocasional`) | Já vende sempre (`vende`) |
|---|---|---|---|
| 2 | O que te move? (`motivacao`) | O que te impede de vender mais? (`desafio`) | Quanto fatura hoje? (`faturamento_atual`) |
| 3 | O que te impede de começar? (`desafio`) | Como divulga hoje? (`divulgacao`) | Maior desafio hoje? (`desafio`) |
| 4 | Meta de faturamento (`meta`) | Meta de faturamento (`meta`) | Meta, com opções **acima do que já fatura** (`meta`) |
| 5 | Pronta para começar agora? (`momento`) | igual | igual |

Cada resposta tem a sua própria mensagem na tela de transição, e a tela final
muda conforme o perfil. Se a pessoa voltar e trocar uma resposta, as respostas
seguintes são descartadas e ela segue o caminho novo.

## 3. O que vai no link final

Exemplo de link final de uma pessoa que já vende:

```
https://seu-link.com/?lead_id=DL-7K2Q9&fbc=fb.1.1712...&perfil=vende&faturamento_atual=1000_3000&desafio=clientes&meta=3000_5000&momento=agora&temperatura=quente&fbclid=...&utm_source=facebook
```

- **lead_id**: código único da pessoa (ex.: `DL-7K2Q9`). O mesmo código vai no
  evento Lead do pixel, para a Meta não contar a mesma conversão duas vezes.
- **fbc / fbp**: identificadores do Facebook, que melhoram a atribuição das vendas.
- **perfil**: `iniciante`, `ocasional` ou `vende`.
- **desafio**: a maior dor da pessoa. Vem em todos os caminhos. Valores
  possíveis: `receitas`, `preco`, `clientes`, `lucro`, `organizacao`, `digital`.
- **meta**: quanto ela quer faturar por mês (ex.: `1000_3000` = de R$ 1.000 a
  R$ 3.000).
- **motivacao**, **divulgacao**, **faturamento_atual**: só aparecem no caminho
  em que são perguntadas.
- **momento** e **temperatura**: `agora` = `quente`, `duvidas` = `morno`,
  `pesquisando` = `frio`.

Com isso o seu atendimento já sabe, antes do "oi", em que momento a pessoa
está e qual é a dor dela.
- **Todos os parâmetros que vieram do anúncio** (fbclid, utm_*, campaign_id,
  adset_id, ad_id, ctwa_clid, gclid... qualquer um).

**Primeiro clique (first touch):** os parâmetros da primeira visita ficam
guardados no celular da pessoa. Se ela sair e voltar depois por outro caminho,
os dados originais continuam valendo.

---

## 4. Instalar o Pixel do Facebook

Basta colocar o ID do pixel no `config.js`. Não precisa colar código no HTML:
```js
metaPixelId: "123456789012345",
```

Para não atrasar a abertura no celular, o script da Meta (cerca de 200 KB) só
carrega no **primeiro toque** da pessoa ou depois de **2,5 segundos**. Os
eventos disparados antes disso ficam numa fila e são enviados assim que o
script carrega, então nada se perde.

Se um dia precisar colar o "código base" completo do pixel (por exemplo, para
correspondência avançada manual), cole no `<head>` do `index.html` e deixe o
`metaPixelId` vazio. O quiz percebe o código colado e não duplica nada.

**Eventos enviados para a Meta:**

| Evento | Quando |
|---|---|
| `PageView` | Ao abrir o quiz. |
| `QuizStart` (personalizado) | Ao tocar em "Começar agora". |
| `QuizStep` (personalizado) | A cada resposta, com a etapa, a pergunta, a resposta e o perfil. |
| `QuizComplete` (personalizado) | Ao chegar na tela de resultado, com a temperatura e o perfil. |
| `Lead` | Ao tocar no botão final, com a temperatura e o perfil. |

Com esses eventos você pode, por exemplo, criar no Gerenciador de Anúncios
públicos de quem já vende e está "quente", ou de quem terminou o quiz mas
não clicou no botão final.

---

## 5. Colar a meta tag de verificação de domínio da Meta

Só é necessário quando o quiz estiver no seu domínio próprio (Etapa 3).

1. No Gerenciador de Negócios da Meta, copie a tag `<meta ...>` fornecida.
2. No `index.html`, cole entre estas duas linhas:
   ```html
   <!-- ===== COLE AQUI A META TAG DE VERIFICAÇÃO DE DOMÍNIO DA META (opcional) ===== -->
   <!-- ===== FIM DA VERIFICAÇÃO ===== -->
   ```
3. Publique a alteração e clique em "Verificar" na Meta.

---

## 6. Testar (modo debug)

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

## 7. Publicar alterações (depois que o site estiver no GitHub)

O jeito mais fácil, sem terminal:

1. Entre no repositório pelo site github.com.
2. Clique no arquivo (ex.: `config.js`) e depois no ícone de **lápis**.
3. Faça a alteração.
4. Clique em **Commit changes** e confirme.
5. Em 1 a 2 minutos o site publicado estará atualizado. Se não aparecer, abra
   numa aba anônima, porque o navegador pode estar mostrando a versão antiga.

---

## 8. Trocar as imagens

Todas as imagens saem da mesma arte (`hero-doces.png`, quadrada). Na pasta `images/`:

| Arquivo | Uso | Tamanho |
|---|---|---|
| `hero-doces.webp` | Imagem da tela inicial (a que o celular baixa) | 640×640, ~30 KB |
| `hero-doces.png` | Reserva para navegadores antigos e imagem do link compartilhado (WhatsApp/Facebook) | 640×640, ~160 KB |
| `favicon-32.png` | Ícone da aba do navegador (recorte dos brigadeiros) | 32×32 |
| `apple-touch-icon.png` | Ícone ao salvar o site na tela do iPhone | 180×180 |

O original em alta resolução está guardado em `hero-doces-original.png`, na
pasta acima de `site/`, fora do site publicado.

**Para trocar a arte:** substitua os arquivos mantendo os mesmos nomes. Use
imagem quadrada, de 640×640 ou maior. Para gerar o `.webp`, use o
squoosh.app (grátis): abra a imagem, escolha WebP, qualidade 80, e baixe. Não
suba imagens de quase 1 MB, que deixam o quiz lento no 4G. Se preferir, me
peça e eu gero todas as versões.

---

## Arquivos do projeto

| Arquivo | O que é |
|---|---|
| `config.js` | **Suas configurações.** É o único que você precisa editar. |
| `index.html` | Estrutura das telas e o espaço para colar a meta tag de verificação. |
| `style.css` | Visual: cores, fontes, tamanhos. |
| `app.js` | Lógica do quiz, rastreamento, pixel e webhook. Não precisa mexer. |
| `images/` | Imagens. |
| `404.html` | Página mostrada quando alguém acessa um endereço que não existe. |
| `.nojekyll` | Arquivo técnico vazio para o GitHub Pages. Não apague. |

Para mudar textos das perguntas, respostas ou transições, procure o trecho
`var Q = {` no começo do `app.js` (os textos da tela final ficam logo abaixo,
em `RESULT_TEXT`). Altere só o texto entre aspas e mantenha as aspas e as
vírgulas. Não mude os campos `value` e `param`, que são os valores que o seu
atendimento e as suas automações recebem.
