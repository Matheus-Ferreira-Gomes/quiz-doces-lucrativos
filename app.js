/* ============================================================
   Quiz Doces Lucrativos — lógica da aplicação
   Você não precisa editar este arquivo: as configurações ficam no config.js
   ============================================================ */
(() => {
  "use strict";

  const CFG = window.QUIZ_CONFIG || {};
  const STORAGE_KEY = "dl_quiz_v2";
  const AUTO_ADVANCE_MS = 4000;   // tempo mínimo até a transição avançar sozinha (textos longos ganham mais tempo)
  const LOADING_MS = 2400;        // duração da tela "Analisando..."
  const LEAD_WAIT_MS = 300;       // espera máxima para o evento Lead sair antes do redirecionamento
  const query = new URLSearchParams(window.location.search);
  const DEBUG = query.get("debug") === "1";

  // ----------------------------------------------------------
  // Perguntas
  // ----------------------------------------------------------
  // Cada pergunta tem:
  //   param   → nome do parâmetro enviado no link final e no webhook
  //   title   → texto da pergunta
  //   options → respostas (label = texto na tela, value = valor enviado,
  //             reply = mensagem da tela de transição para essa resposta,
  //             short = texto curto usado no resumo da tela final)
  //   reply   → mensagem de transição padrão, quando a resposta não tem a sua
  const Q = {
    perfil: {
      param: "perfil",
      title: "Você já vende doces hoje?",
      options: [
        { label: "Ainda não, quero começar", value: "iniciante", short: "Quero começar a vender",
          reply: "Que bom que você chegou antes de começar! Quem começa já sabendo o que vende e quanto cobrar evita os erros que fazem muita gente desistir." },
        { label: "Já vendi algumas vezes, mas sem constância", value: "ocasional", short: "Já vendo, mas sem constância",
          reply: "Você já deu o primeiro passo, e ele é o mais difícil! Agora é transformar essas vendas soltas numa renda que entra todo mês." },
        { label: "Sim, já vendo com frequência", value: "vende", short: "Já vendo com frequência",
          reply: "Que demais! Você já provou que as pessoas compram de você. Agora vamos ver o que falta para esse trabalho virar lucro de verdade." }
      ]
    },

    // ----- Caminho: ainda não vende -----
    motivacao: {
      param: "motivacao",
      title: "O que mais te move a querer vender doces?",
      options: [
        { label: "Complementar a renda da casa", value: "renda_extra",
          reply: "Uma renda extra muda o mês inteiro: é a conta que fecha e a folga que aparece. E doce é um dos jeitos mais rápidos de chegar lá." },
        { label: "Ter o meu próprio dinheiro", value: "independencia",
          reply: "Ter o seu próprio dinheiro, sem depender de ninguém, não tem preço. E dá para conquistar isso trabalhando da sua cozinha." },
        { label: "Sair do emprego e viver disso", value: "sair_emprego",
          reply: "Muita gente que hoje vive de doces começou exatamente com esse sonho. Com método e os números certos, ele é bem real." }
      ]
    },
    desafio_iniciante: {
      param: "desafio",
      title: "O que mais te impede de começar hoje?",
      options: [
        { label: "Não sei quais doces vendem mais", value: "receitas",
          reply: "Faz todo sentido. Começar com as receitas certas, que vendem e rendem bem, faz toda a diferença logo no primeiro mês." },
        { label: "Não sei quanto cobrar para ter lucro", value: "preco",
          reply: "Esse é o erro mais comum: cobrar \"no olho\" e trabalhar de graça sem perceber. Quando você sabe seus números, tudo muda de figura." },
        { label: "Tenho medo de não ter clientes", value: "clientes",
          reply: "Esse medo é normal, mas os primeiros clientes costumam estar mais perto do que você imagina: família, vizinhos, trabalho e o seu WhatsApp." }
      ]
    },

    // ----- Caminho: vende de vez em quando -----
    desafio_ocasional: {
      param: "desafio",
      title: "O que mais te impede de vender com mais frequência?",
      options: [
        { label: "Tenho poucos clientes e encomendas", value: "clientes",
          reply: "Cliente fiel não aparece por sorte: vem de um jeito certo de divulgar e de fazer a pessoa voltar a comprar. E isso se aprende." },
        { label: "Não sei se estou tendo lucro", value: "lucro",
          reply: "Pois é... esse é o erro que faz muita gente trabalhar muito e ganhar pouco. Quando você sabe seus números, tudo muda de figura." },
        { label: "Falta organização e rotina", value: "organizacao",
          reply: "Com um cardápio enxuto e uma rotina simples de produção, dá para vender toda semana sem viver dentro da cozinha." }
      ]
    },
    divulgacao: {
      param: "divulgacao",
      title: "Como as pessoas ficam sabendo dos seus doces hoje?",
      options: [
        { label: "Só no boca a boca", value: "boca_a_boca",
          reply: "O boca a boca é ouro! E dá para multiplicar ele com o WhatsApp e o Instagram, sem precisar virar blogueira." },
        { label: "Pelo status e grupos do WhatsApp", value: "whatsapp",
          reply: "Ótimo começo! Com as fotos e mensagens certas, o seu status vira uma vitrine que vende todos os dias." },
        { label: "Também pelo Instagram", value: "instagram",
          reply: "Você já está no digital, e isso é uma vantagem enorme. Agora é fazer esse perfil trazer encomendas de verdade." }
      ]
    },

    // ----- Caminho: já vende com frequência -----
    faturamento: {
      param: "faturamento_atual",
      title: "Quanto você fatura hoje, por mês, com doces?",
      options: [
        { label: "Até R$ 1.000", value: "ate_1000" },
        { label: "De R$ 1.000 a R$ 3.000", value: "1000_3000" },
        { label: "Mais de R$ 3.000", value: "mais_3000" }
      ],
      reply: "Anotado! Esse é o seu ponto de partida. Agora vamos entender o que está segurando o seu crescimento."
    },
    desafio_vende: {
      param: "desafio",
      title: "Qual é o seu maior desafio hoje?",
      options: [
        { label: "Trabalho muito e sobra pouco lucro", value: "lucro",
          reply: "Pois é... esse é o erro que faz muita gente trabalhar muito e ganhar pouco. Quando você sabe seus números, tudo muda de figura." },
        { label: "Quero mais clientes e encomendas", value: "clientes",
          reply: "Você já tem quem compra. Com o método certo, esses clientes voltam sempre e ainda indicam outros." },
        { label: "Vender mais pelo Instagram e WhatsApp", value: "digital",
          reply: "O digital é onde está o seu próximo salto. Com as estratégias certas, as encomendas passam a chegar até você." }
      ]
    },
    meta_vende: {
      param: "meta",
      title: "E aonde você quer chegar nos próximos meses?",
      // As opções dependem de quanto a pessoa já fatura: a meta é sempre maior que o atual
      options: (answers) => {
        const porFaturamento = {
          ate_1000: [["De R$ 1.000 a R$ 3.000", "1000_3000"], ["De R$ 3.000 a R$ 5.000", "3000_5000"], ["Mais de R$ 5.000", "mais_5000"]],
          "1000_3000": [["De R$ 3.000 a R$ 5.000", "3000_5000"], ["De R$ 5.000 a R$ 10.000", "5000_10000"], ["Mais de R$ 10.000", "mais_10000"]],
          mais_3000: [["De R$ 5.000 a R$ 10.000", "5000_10000"], ["De R$ 10.000 a R$ 20.000", "10000_20000"], ["Mais de R$ 20.000", "mais_20000"]]
        };
        return (porFaturamento[answers.faturamento] || porFaturamento.ate_1000)
          .map(([label, value]) => ({ label: `${label} por mês`, value }));
      },
      reply: "Ótima meta! Quem já vende e acerta o preço e a divulgação costuma crescer rápido. Você está no caminho certo."
    },

    // ----- Perguntas comuns aos caminhos -----
    meta: {
      param: "meta",
      title: "Quanto você gostaria de faturar por mês com os seus doces?",
      options: [
        { label: "Até R$ 1.000 por mês", value: "ate_1000" },
        { label: "De R$ 1.000 a R$ 3.000 por mês", value: "1000_3000" },
        { label: "Mais de R$ 3.000 por mês", value: "mais_3000" }
      ],
      reply: "Esse valor é totalmente possível. Milhares já chegaram lá vendendo no boca a boca e no digital, e você também pode."
    },
    momento: {
      param: "momento",
      title: "Se existisse um passo a passo completo para você lucrar de verdade, você estaria pronta para começar agora?",
      options: [
        { label: "Sim, quero começar agora", value: "agora",
          reply: "Perfeito! Então você está a um passo de transformar os seus doces numa renda de verdade. Vou te conectar agora com alguém que vai te mostrar exatamente como." },
        { label: "Quero, mas tenho dúvidas", value: "duvidas",
          reply: "É super normal ter dúvidas antes de começar. Vou te conectar com alguém que vai tirar todas elas e te mostrar o caminho." },
        { label: "Só estou pesquisando", value: "pesquisando",
          reply: "Tudo bem! Pesquisar antes mostra que você leva isso a sério. Vou te mostrar como funciona, e você decide com calma." }
      ]
    }
  };
  Object.keys(Q).forEach((key) => { Q[key].key = key; });

  // Sequência de perguntas de cada perfil (definido pela 1ª resposta)
  const FLOWS = {
    iniciante: [Q.perfil, Q.motivacao, Q.desafio_iniciante, Q.meta, Q.momento],
    ocasional: [Q.perfil, Q.desafio_ocasional, Q.divulgacao, Q.meta, Q.momento],
    vende: [Q.perfil, Q.faturamento, Q.desafio_vende, Q.meta_vende, Q.momento]
  };
  const TOTAL = 5;

  // Texto da tela final de cada perfil
  const RESULT_TEXT = {
    iniciante: "Você está no momento perfeito para começar do jeito certo. Com as receitas que mais vendem, a planilha que calcula o seu lucro e o método para vender no boca a boca e no digital, os seus primeiros doces já saem dando lucro.",
    ocasional: "Você já sabe que as pessoas compram os seus doces. Falta transformar as vendas soltas em rotina: as receitas certas, a planilha que calcula o seu lucro e o método para vender todo mês, no boca a boca e no digital.",
    vende: "Você já tem o mais difícil: clientes. Agora é fazer cada doce dar lucro de verdade, com a planilha que calcula o seu preço certo, receitas que rendem mais e o método para vender ainda mais no boca a boca e no digital."
  };

  const TEMPERATURA = { agora: "quente", duvidas: "morno", pesquisando: "frio" };

  // ----------------------------------------------------------
  // Estado salvo no navegador (permite retomar de onde parou)
  // ----------------------------------------------------------
  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  };
  const saveState = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* modo privado: segue sem salvar */ }
  };

  const nowIso = () => new Date().toISOString();

  // lead_id curto e legível, sem caracteres ambíguos (O/0/I/1)
  const generateLeadId = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(5);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let j = 0; j < bytes.length; j++) bytes[j] = Math.floor(Math.random() * 256);
    }
    return "DL-" + Array.from(bytes, (b) => chars.charAt(b % chars.length)).join("");
  };

  const state = loadState();
  state.answers = state.answers || {};
  state.tracking = state.tracking || {};
  state.step = typeof state.step === "number" ? Math.max(0, Math.min(state.step, TOTAL)) : 0;
  state.leadId = state.leadId || generateLeadId();

  // ----------------------------------------------------------
  // Respostas
  // ----------------------------------------------------------
  const getFlow = () => FLOWS[state.answers.perfil] || FLOWS.iniciante;
  const optionsFor = (q) => (typeof q.options === "function" ? q.options(state.answers) : q.options);
  const chosenOption = (q) => optionsFor(q).find((o) => o.value === state.answers[q.key]) || null;

  // Respostas do caminho atual, com os nomes de parâmetro (perfil, desafio, meta...)
  const answeredParams = () => {
    const out = {};
    getFlow().forEach((q) => { if (state.answers[q.key]) out[q.param] = state.answers[q.key]; });
    return out;
  };
  const answeredLabels = () => {
    const out = {};
    getFlow().forEach((q) => { const o = chosenOption(q); if (o) out[q.param] = o.label; });
    return out;
  };

  const getTemperatura = () => TEMPERATURA[state.answers.momento] || "";

  // ----------------------------------------------------------
  // Cookies
  // ----------------------------------------------------------
  const getCookie = (name) => {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? m[1] : "";
  };
  const setCookie = (name, value, days) => {
    document.cookie = `${name}=${value}; max-age=${days * 86400}; path=/; SameSite=Lax` +
      (location.protocol === "https:" ? "; Secure" : "");
  };
  const getFbc = () => getCookie("_fbc") || state.fbc || "";
  const getFbp = () => getCookie("_fbp");

  // ----------------------------------------------------------
  // 1. Captura dos parâmetros de chegada (modelo first touch)
  // ----------------------------------------------------------
  // Guarda TODOS os parâmetros da URL. Se já existir um conjunto salvo de
  // uma visita anterior, ele é mantido inteiro (não mistura visitas e uma
  // visita sem parâmetros não apaga nada).
  const captureTracking = () => {
    const incoming = {};
    query.forEach((value, key) => {
      if (key !== "debug" && value !== "") incoming[key] = value;
    });

    if (!state.firstVisitAt) {
      state.firstVisitAt = nowIso();
      state.landingUrl = location.href;
      state.referrer = document.referrer || "";
    }

    if (Object.keys(incoming).length && !Object.keys(state.tracking).length) {
      state.tracking = incoming;
      state.landingUrl = location.href;
      state.referrer = document.referrer || "";
    }

    // fbc no formato da Meta: fb.1.{timestamp_ms}.{fbclid}
    // Só recria o cookie se o fbclid for diferente do que já está nele.
    const fbclid = query.get("fbclid");
    if (fbclid) {
      let fbc = getCookie("_fbc");
      if (fbc.split(".").slice(3).join(".") !== fbclid) {
        fbc = `fb.1.${Date.now()}.${fbclid}`;
        setCookie("_fbc", fbc, 90);
      }
      state.fbc = fbc; // cópia de segurança caso o navegador bloqueie cookies
    }

    saveState();
  };

  // ----------------------------------------------------------
  // Pixel do Facebook (pelo ID do config.js ou pelo código colado)
  // ----------------------------------------------------------
  let pixelMode = "não instalado";
  const eventLog = [];

  const logEvent = (name, data, note) => {
    eventLog.push(`${new Date().toLocaleTimeString("pt-BR")}  ${name} ${JSON.stringify(data || {})}  → ${note}`);
    renderDebug();
  };

  // custom = true para eventos personalizados (trackCustom)
  const track = (name, data, options, custom) => {
    const hasPixel = typeof window.fbq === "function";
    if (hasPixel) {
      const method = custom ? "trackCustom" : "track";
      if (options) window.fbq(method, name, data || {}, options);
      else window.fbq(method, name, data || {});
    }
    logEvent(name, data, hasPixel ? (options && options.eventID ? "eventID " + options.eventID : "enviado") : "sem pixel (não enviado)");
  };

  const setupPixel = () => {
    // Código completo colado no <head>: ele já fez init + PageView
    if (typeof window.fbq === "function") {
      pixelMode = "código colado no index.html";
      logEvent("PageView", {}, "disparado pelo código colado");
      return;
    }

    const id = String(CFG.metaPixelId || "").trim();
    if (!id) return;
    if (!/^\d+$/.test(id)) {
      pixelMode = "ID inválido no config.js (use só números)";
      return;
    }

    // Fila oficial do fbq: os eventos ficam guardados até o script da Meta carregar
    const n = (...args) => {
      if (n.callMethod) n.callMethod(...args); else n.queue.push(args);
    };
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    pixelMode = `ID do config.js (${id})`;
    n("init", id);
    track("PageView");

    // Carrega o script da Meta só depois da página pronta, para não atrasar a abertura
    const inject = () => {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    };
    if (document.readyState === "complete") inject(); else window.addEventListener("load", inject);
  };

  // ----------------------------------------------------------
  // 2. Montagem do link final
  // ----------------------------------------------------------
  // Regras de prioridade quando o mesmo parâmetro aparece em mais de um lugar:
  //   1º o que já está no link configurado em config.js (nunca é sobrescrito)
  //   2º os dados gerados pelo quiz (lead_id, fbc, fbp, respostas, temperatura)
  //   3º os parâmetros que chegaram na URL (fbclid, utm_*, ids de campanha...)
  // Parâmetros vazios nunca são adicionados. A API URL cuida do encode.
  const buildRedirectUrl = () => {
    const url = new URL(String(CFG.redirectUrl || "").trim());

    const add = (key, value) => {
      if (value === undefined || value === null || String(value) === "") return;
      if (url.searchParams.has(key)) return; // quem chegou primeiro vence
      url.searchParams.set(key, String(value));
    };

    add("lead_id", state.leadId);
    add("fbc", getFbc());
    add("fbp", getFbp());

    if (CFG.sendAnswersInUrl) {
      Object.entries(answeredParams()).forEach(([key, value]) => add(key, value));
      add("temperatura", getTemperatura());
    }

    Object.entries(state.tracking).forEach(([key, value]) => add(key, value));

    return url.toString();
  };

  const isRedirectConfigured = () => {
    const raw = String(CFG.redirectUrl || "").trim();
    if (!raw || /COLE-AQUI/i.test(raw)) return false;
    try {
      const u = new URL(raw);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch (e) {
      return false;
    }
  };

  // ----------------------------------------------------------
  // 3. Webhook (opcional)
  // ----------------------------------------------------------
  // Enviado como formulário (application/x-www-form-urlencoded): é o formato
  // que n8n, Make e Zapier leem sem configuração e que o navegador envia sem
  // bloqueio de CORS. O campo "json" traz tudo junto em JSON.
  const sendWebhook = (finalUrl) => {
    const endpoint = String(CFG.webhookUrl || "").trim();
    if (!endpoint) return;

    const answers = answeredParams();
    const data = {
      lead_id: state.leadId,
      temperatura: getTemperatura(),
      answers,
      answer_labels: answeredLabels(),
      params: state.tracking,
      fbc: getFbc(),
      fbp: getFbp(),
      landing_url: state.landingUrl || location.href,
      page_url: location.href,
      redirect_url: finalUrl,
      referrer: state.referrer || "",
      user_agent: navigator.userAgent,
      first_visit_at: state.firstVisitAt || "",
      started_at: state.startedAt || "",
      completed_at: state.completedAt || "",
      clicked_at: state.clickedAt || ""
    };

    const { answers: _a, answer_labels: _l, params: _p, ...fields } = data;
    const flat = { ...state.tracking, ...answers, ...fields };

    const form = new URLSearchParams();
    Object.entries(flat).forEach(([k, v]) => { if (v !== "") form.append(k, v); });
    form.append("json", JSON.stringify(data));

    let sent = false;
    try { sent = !!(navigator.sendBeacon && navigator.sendBeacon(endpoint, form)); } catch (e) { sent = false; }
    if (!sent) {
      try {
        fetch(endpoint, { method: "POST", body: form, mode: "no-cors", keepalive: true }).catch(() => {});
      } catch (e) { /* nunca bloqueia o redirecionamento */ }
    }
    logEvent("Webhook", { url: endpoint }, sent ? "enviado (sendBeacon)" : "enviado (fetch)");
  };

  // ----------------------------------------------------------
  // Navegação entre telas
  // ----------------------------------------------------------
  const $ = (id) => document.getElementById(id);

  const screens = {
    intro: $("screen-intro"),
    question: $("screen-question"),
    transition: $("screen-transition"),
    loading: $("screen-loading"),
    result: $("screen-result")
  };
  let currentScreen = "intro";
  let lockUntil = 0;
  let autoTimer = null;
  let loadingTimer = null;

  const updateProgress = () => {
    const done = { intro: 0, question: state.step + 1, transition: state.step, loading: TOTAL, result: TOTAL }[currentScreen];
    $("progressFill").style.width = (done / TOTAL) * 100 + "%";
    $("topbar").classList.toggle("visible", currentScreen !== "intro");
  };

  const show = (name, moveFocus) => {
    clearTimeout(autoTimer);
    clearTimeout(loadingTimer);
    Object.keys(screens).forEach((k) => screens[k].classList.toggle("active", k === name));
    currentScreen = name;
    // bloqueia toques por um instante: evita que um toque duplo "atravesse" para a tela seguinte
    lockUntil = Date.now() + 350;
    updateProgress();
    window.scrollTo(0, 0);
    if (moveFocus !== false) {
      const target = screens[name].querySelector("[tabindex='-1']");
      if (target) target.focus({ preventScroll: true });
    }
    renderDebug();
  };

  const guard = (fn) => (e) => {
    if (Date.now() < lockUntil) return;
    fn(e);
  };

  // ---------- Abertura ----------
  const setupIntro = () => {
    const resuming = state.step > 0 && state.step < TOTAL;
    $("btnStart").textContent = resuming ? "Continuar de onde parei" : "Começar agora";
    $("resumeNote").hidden = !resuming;
    $("resumeNote").textContent = `Você já respondeu ${state.step} de ${TOTAL} perguntas.`;
    $("btnRestart").hidden = !resuming;
  };

  const start = () => {
    if (!state.startedAt) {
      state.startedAt = nowIso();
      saveState();
      track("QuizStart", {}, null, true);
    }
    if (state.step >= TOTAL) showLoading();
    else renderQuestion(state.step);
  };

  const restart = () => {
    state.answers = {};
    state.step = 0;
    state.startedAt = nowIso();
    state.completedAt = "";
    saveState();
    track("QuizStart", { recomeco: true }, null, true);
    renderQuestion(0);
  };

  // ---------- Perguntas ----------
  const renderQuestion = (index) => {
    const q = getFlow()[index];
    state.step = index;
    saveState();

    $("questionTitle").textContent = q.title;
    $("stepLabel").textContent = `Pergunta ${index + 1} de ${TOTAL}`;

    const box = $("options");
    box.textContent = "";
    box.classList.remove("locked");
    optionsFor(q).forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.textContent = opt.label;
      b.setAttribute("aria-pressed", String(state.answers[q.key] === opt.value));
      b.addEventListener("click", guard(() => selectOption(index, opt.value, b)));
      box.appendChild(b);
    });

    show("question");
  };

  // Marca a opção escolhida por um instante (feedback visual) e segue
  const selectOption = (index, value, btn) => {
    const box = $("options");
    if (box.classList.contains("locked")) return;
    box.classList.add("locked");
    Array.from(box.children).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    setTimeout(() => answer(index, value), 180);
  };

  const answer = (index, value) => {
    const flow = getFlow();
    const q = flow[index];

    // Mudou a resposta? As perguntas seguintes podem ter mudado (outro caminho
    // ou outras opções), então as respostas posteriores são descartadas.
    if (state.answers[q.key] !== value) {
      const keep = {};
      flow.slice(0, index).forEach((x) => {
        if (state.answers[x.key]) keep[x.key] = state.answers[x.key];
      });
      state.answers = keep;
    }
    state.answers[q.key] = value;
    state.step = index + 1;
    saveState();

    track("QuizStep", { step: index + 1, pergunta: q.param, resposta: value, perfil: state.answers.perfil }, null, true);

    const reply = (chosenOption(q) || {}).reply || q.reply || "";
    $("transitionText").textContent = reply;
    show("transition");

    // Textos mais longos ficam mais tempo na tela (~230ms por palavra, entre 4s e 7s)
    const ms = Math.min(7000, Math.max(AUTO_ADVANCE_MS, reply.split(/\s+/).length * 230));
    const btn = $("btnContinue");
    btn.style.setProperty("--countdown", ms + "ms");
    btn.classList.remove("counting");
    void btn.offsetWidth; // reinicia a animação da barrinha de contagem
    btn.classList.add("counting");
    autoTimer = setTimeout(advance, ms);
  };

  const advance = () => {
    if (state.step >= TOTAL) showLoading();
    else renderQuestion(state.step);
  };

  // Volta uma pergunta. Da pergunta 1, volta para a abertura.
  const goBack = () => {
    if (currentScreen === "intro") return;
    const target = state.step - 1;
    if (target < 0) {
      setupIntro();
      show("intro");
    } else {
      renderQuestion(target);
    }
  };

  // ---------- Carregando e resultado ----------
  const showLoading = () => {
    show("loading");
    loadingTimer = setTimeout(() => {
      if (!state.completedAt) {
        state.completedAt = nowIso();
        saveState();
      }
      track("QuizComplete", { temperatura: getTemperatura(), perfil: state.answers.perfil }, null, true);
      renderResult();
    }, LOADING_MS);
  };

  const renderResult = (moveFocus) => {
    $("resultText").textContent = RESULT_TEXT[state.answers.perfil] || RESULT_TEXT.iniciante;

    // Resumo do perfil: momento, maior desafio e meta
    const labelOf = (param) => {
      const q = getFlow().find((x) => x.param === param);
      const o = q && chosenOption(q);
      return o ? (o.short || o.label) : "";
    };
    const rows = [
      ["Seu momento", labelOf("perfil")],
      ["Seu maior desafio", labelOf("desafio")],
      ["Sua meta", labelOf("meta")]
    ].filter(([, value]) => value);

    const profile = $("profile");
    profile.textContent = "";
    rows.forEach(([label, value]) => {
      const wrap = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      wrap.append(dt, dd);
      profile.appendChild(wrap);
    });
    profile.hidden = rows.length === 0;

    $("redirectWarning").hidden = !(DEBUG && !isRedirectConfigured());
    resetFinalButton();
    show("result", moveFocus);
  };

  let redirecting = false;

  const resetFinalButton = () => {
    redirecting = false;
    const b = $("btnFinal");
    b.textContent = CFG.buttonText || "Continuar";
    b.classList.remove("is-loading");
    b.removeAttribute("aria-busy");
  };

  // Clique final: Lead no pixel → webhook → redirecionamento
  const onFinalClick = () => {
    if (redirecting) return;

    const configured = isRedirectConfigured();
    const finalUrl = configured ? buildRedirectUrl() : "";

    state.clickedAt = nowIso();
    saveState();

    // eventID = lead_id para a Meta deduplicar com a API de Conversões
    track("Lead", { temperatura: getTemperatura(), perfil: state.answers.perfil, content_name: "Quiz Doces Lucrativos" }, { eventID: state.leadId });
    sendWebhook(finalUrl);

    if (DEBUG) {
      // em modo debug nunca redireciona: só mostra a URL no painel
      openDebugAtUrl();
      return;
    }
    if (!configured) {
      console.warn("[Quiz] Configure o redirectUrl no config.js.");
      return;
    }

    redirecting = true;
    const b = $("btnFinal");
    b.textContent = "Abrindo...";
    b.classList.add("is-loading");
    b.setAttribute("aria-busy", "true");

    // Dá até 300ms para o pixel enviar o Lead; redireciona de qualquer jeito
    setTimeout(() => {
      window.location.href = finalUrl;
    }, typeof window.fbq === "function" ? LEAD_WAIT_MS : 0);
  };

  // ----------------------------------------------------------
  // Botão "voltar" do celular: volta uma pergunta em vez de sair do quiz
  // ----------------------------------------------------------
  let backTrapArmed = false;

  const armBackTrap = () => {
    if (backTrapArmed || currentScreen === "intro") return;
    try {
      history.pushState({ dlQuiz: true }, "");
      backTrapArmed = true;
    } catch (e) { /* navegador sem suporte: segue normal */ }
  };

  // ----------------------------------------------------------
  // 4. Painel de debug (?debug=1)
  // ----------------------------------------------------------
  let debugBody = null;

  const previewUrl = () => {
    try { return buildRedirectUrl(); } catch (e) { return `(link inválido no config.js: ${CFG.redirectUrl})`; }
  };

  const renderDebug = () => {
    if (!debugBody) return;
    const rows = [];
    if (!isRedirectConfigured()) {
      rows.push(["Atenção", "redirectUrl ainda não foi configurado no config.js. A URL abaixo usa o texto de exemplo só para mostrar os parâmetros.", "alert"]);
    }
    rows.push(
      ["URL final que seria aberta", previewUrl(), "url"],
      ["lead_id", state.leadId],
      ["temperatura", getTemperatura() || "(responda a última pergunta)"],
      ["Pixel", pixelMode],
      ["fbc", getFbc() || "(nenhum: só existe quando chega fbclid na URL)"],
      ["fbp", getFbp() || "(nenhum: o cookie _fbp é criado pelo pixel)"],
      ["Parâmetros capturados (first touch)", JSON.stringify(state.tracking, null, 2)],
      ["URL de entrada", state.landingUrl || ""],
      ["Respostas", JSON.stringify(answeredLabels(), null, 2)],
      ["Eventos disparados", eventLog.join("\n") || "(nenhum ainda)"]
    );

    debugBody.textContent = "";
    rows.forEach(([label, value, kind]) => {
      const row = document.createElement("div");
      row.className = "debug-row" + (kind === "alert" ? " alert" : "");
      if (kind === "url") row.id = "debugUrlRow";
      const b = document.createElement("b");
      const pre = document.createElement("pre");
      b.textContent = label;
      pre.textContent = value;
      row.append(b, pre);
      debugBody.appendChild(row);
    });
  };

  const openDebugAtUrl = () => {
    const panel = $("debugPanel");
    panel.classList.remove("collapsed");
    const toggle = panel.querySelector('[data-act="toggle"]');
    toggle.textContent = "Minimizar";
    toggle.setAttribute("aria-expanded", "true");
    renderDebug();
    const row = $("debugUrlRow");
    if (row) {
      row.classList.add("highlight");
      panel.scrollTop = Math.max(0, row.offsetTop - 40);
    }
  };

  const copyText = (text, btn) => {
    const done = () => {
      btn.textContent = "Copiado!";
      setTimeout(() => { btn.textContent = "Copiar URL"; }, 1500);
    };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* ignora */ }
      document.body.removeChild(ta);
      done();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  };

  const initDebug = () => {
    if (!DEBUG) return;
    document.body.classList.add("has-debug");
    const panel = $("debugPanel");
    panel.hidden = false;
    panel.classList.add("collapsed");
    panel.innerHTML =
      '<div class="debug-head"><strong>Modo debug (não redireciona)</strong><span>' +
      '<button type="button" data-act="copy">Copiar URL</button> ' +
      '<button type="button" data-act="reset">Limpar dados</button> ' +
      '<button type="button" data-act="toggle" aria-expanded="false">Expandir</button>' +
      '</span></div><div class="debug-body"></div>';
    debugBody = panel.querySelector(".debug-body");

    panel.addEventListener("click", (e) => {
      const act = e.target.getAttribute && e.target.getAttribute("data-act");
      if (act === "copy") copyText(previewUrl(), e.target);
      if (act === "toggle") {
        const collapsed = panel.classList.toggle("collapsed");
        e.target.textContent = collapsed ? "Expandir" : "Minimizar";
        e.target.setAttribute("aria-expanded", String(!collapsed));
      }
      if (act === "reset") {
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignora */ }
        document.cookie = "_fbc=; max-age=0; path=/";
        location.reload();
      }
    });
  };

  // ----------------------------------------------------------
  // Inicialização
  // ----------------------------------------------------------
  captureTracking();
  initDebug();
  setupPixel();

  $("btnStart").addEventListener("click", guard(start));
  $("btnRestart").addEventListener("click", guard(restart));
  $("btnRedo").addEventListener("click", guard(restart));
  $("btnContinue").addEventListener("click", guard(advance));
  $("btnFinal").addEventListener("click", onFinalClick);
  $("btnBack").addEventListener("click", guard(() => {
    goBack();
    if (currentScreen === "intro" && backTrapArmed) {
      backTrapArmed = false;
      history.back();
    }
  }));

  window.addEventListener("popstate", () => {
    backTrapArmed = false;
    if (currentScreen === "intro") return;
    goBack();
    armBackTrap();
  });

  // Ativa a proteção do botão voltar a cada toque dentro do quiz
  document.addEventListener("click", armBackTrap);

  // Se a pessoa voltar do link final pelo "voltar", o botão volta ao normal
  window.addEventListener("pageshow", (e) => { if (e.persisted) resetFinalButton(); });

  // Retomar de onde parou
  if (state.step >= TOTAL) {
    renderResult(false);
  } else {
    setupIntro();
    show("intro", false);
  }
})();