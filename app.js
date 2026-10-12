/* ============================================================
   Quiz Doces Lucrativos — lógica da aplicação
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.QUIZ_CONFIG || {};
  var STORAGE_KEY = "dl_quiz_v1";
  var urlParams = new URLSearchParams(window.location.search);
  var isDebug = urlParams.get("debug") === "1";

  // ----------------------------------------------------------
  // Perguntas
  // ----------------------------------------------------------
  var QUESTIONS = [
    {
      id: "q1",
      title: "O que mais te move a querer fazer doces para vender?",
      options: [
        { label: "Complementar a minha renda", value: "renda_extra" },
        { label: "Sair do meu emprego atual", value: "sair_emprego" },
        { label: "Já vendo, mas quero lucrar mais", value: "ja_vendo" }
      ],
      transition: "Que bom te ver aqui! Seja qual for o seu sonho, ele cabe num docinho bem vendido. Bora descobrir o seu potencial?"
    },
    {
      id: "q2",
      title: "Hoje, como você se sente com o seu dinheiro no fim do mês?",
      options: [
        { label: "Sempre falta", value: "sempre_falta" },
        { label: "Fico no aperto", value: "aperto" },
        { label: "Sobra pouco", value: "sobra_pouco" }
      ],
      transition: "Olha, você não está sozinha nisso. A maioria das mulheres que começam a vender doces sente exatamente isso. E a boa notícia é que dá para mudar."
    },
    {
      id: "q3",
      title: "Você sabe quanto lucra de verdade em cada doce que vende?",
      options: [
        { label: "Não faço ideia", value: "nao_sei" },
        { label: "Mais ou menos", value: "mais_ou_menos" },
        { label: "Sei exatamente", value: "sei" }
      ],
      transition: "Pois é... esse é o erro que faz muita gente trabalhar muito e ganhar pouco. Quando você sabe seus números, tudo muda de figura."
    },
    {
      id: "q4",
      title: "Quanto você gostaria de faturar por mês com os seus doces?",
      options: [
        { label: "Até R$ 1.000", value: "ate_1000" },
        { label: "De R$ 1.000 a R$ 3.000", value: "1000_3000" },
        { label: "Mais de R$ 3.000", value: "mais_3000" }
      ],
      transition: "Esse valor é totalmente possível. Milhares já chegaram lá vendendo no boca a boca e no digital, e você também pode."
    },
    {
      id: "q5",
      title: "Se existisse um passo a passo completo para você lucrar de verdade, você estaria pronta para começar agora?",
      options: [
        { label: "Sim, quero começar agora", value: "agora" },
        { label: "Quero, mas tenho dúvidas", value: "duvidas" },
        { label: "Só estou pesquisando", value: "pesquisando" }
      ],
      transition: "Perfeito! Então você está a um passo de transformar os seus doces numa renda de verdade. Vou te conectar agora com alguém que vai te mostrar exatamente como."
    }
  ];

  // ----------------------------------------------------------
  // Estado (persistido em localStorage para retomar de onde parou)
  // ----------------------------------------------------------
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* localStorage indisponível (modo privado etc.) — segue sem persistir */
    }
  }

  var state = loadState();
  state.answers = state.answers || {};
  state.currentQuestion = typeof state.currentQuestion === "number" ? state.currentQuestion : 0;
  state.trackingParams = state.trackingParams || {};
  state.leadId = state.leadId || generateLeadId();
  saveState(state);

  // ----------------------------------------------------------
  // Captura de parâmetros de rastreamento (modelo first touch)
  // ----------------------------------------------------------
  function captureTrackingParams() {
    var incoming = {};
    urlParams.forEach(function (value, key) {
      if (key !== "debug" && value) incoming[key] = value;
    });

    // first touch: só grava se ainda não houver parâmetros guardados,
    // ou complementa com o que vier de novo sem apagar o que já existia
    var hadAny = Object.keys(state.trackingParams).length > 0;
    if (!hadAny) {
      state.trackingParams = incoming;
    } else {
      // mantém os valores originais; só adiciona chaves novas que não existiam
      Object.keys(incoming).forEach(function (key) {
        if (!(key in state.trackingParams)) {
          state.trackingParams[key] = incoming[key];
        }
      });
    }

    // fbc: gera a partir do fbclid de chegada, no formato da Meta
    var fbclid = urlParams.get("fbclid");
    if (fbclid) {
      var existingFbc = getCookie("_fbc");
      var alreadyHasSameClid = existingFbc && existingFbc.indexOf(fbclid) !== -1;
      if (!alreadyHasSameClid) {
        var fbc = "fb.1." + Date.now() + "." + fbclid;
        setCookie("_fbc", fbc, 90);
      }
    }

    saveState(state);
  }

  function generateLeadId() {
    // Sem caracteres ambíguos: sem O, 0, I, 1
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var code = "";
    for (var i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return "DL-" + code;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  captureTrackingParams();

  // ----------------------------------------------------------
  // Pixel do Facebook
  // ----------------------------------------------------------
  var pixelMode = "nenhum"; // "id" | "codigo_colado" | "nenhum"
  var pixelReady = false;

  function initPixel() {
    if (typeof window.fbq === "function") {
      // já existe (código colado manualmente no <head>)
      pixelMode = "codigo_colado";
      pixelReady = true;
      return;
    }

    var pixelId = CFG.metaPixelId && CFG.metaPixelId.trim();
    if (!pixelId) return;

    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq("init", pixelId);
    pixelMode = "id";
    pixelReady = true;
  }

  initPixel();

  function firePixelEvent(eventName, params, options) {
    if (typeof window.fbq !== "function") return false;
    if (options) {
      window.fbq("track", eventName, params || {}, options);
    } else {
      window.fbq("track", eventName, params || {});
    }
    return true;
  }

  // PageView único
  if (pixelReady && !state.pageViewSent) {
    firePixelEvent("PageView");
    state.pageViewSent = true;
    saveState(state);
  }

  var firedEvents = [];
  function trackEvent(name, params, options) {
    var sent = firePixelEvent(name, params, options);
    firedEvents.push({ name: name, params: params || {}, sent: sent });
    renderDebugPanel();
  }

  // ----------------------------------------------------------
  // Navegação entre telas
  // ----------------------------------------------------------
  var screens = {
    intro: document.getElementById("screen-intro"),
    question: document.getElementById("screen-question"),
    transition: document.getElementById("screen-transition"),
    loading: document.getElementById("screen-loading"),
    result: document.getElementById("screen-result")
  };

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle("active", key === name);
    });
  }

  function updateProgress() {
    var fill = document.getElementById("progressFill");
    var pct = Math.min(100, (state.currentQuestion / QUESTIONS.length) * 100);
    fill.style.width = pct + "%";
  }

  var transitionTimer = null;

  function renderQuestion(index) {
    var q = QUESTIONS[index];
    document.getElementById("questionTitle").textContent = q.title;
    var container = document.getElementById("optionsContainer");
    container.innerHTML = "";
    q.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", function () {
        answerQuestion(index, opt.value, q);
      });
      container.appendChild(btn);
    });
    document.getElementById("btnBack").style.visibility = index === 0 ? "hidden" : "visible";
    updateProgress();
    showScreen("question");
  }

  function answerQuestion(index, value, question) {
    state.answers[question.id] = value;
    state.currentQuestion = index + 1;
    saveState(state);

    trackEvent("QuizStep", { step: index + 1 });

    document.getElementById("transitionText").textContent = question.transition;
    showScreen("transition");

    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(advanceFromTransition, 4000);
  }

  function advanceFromTransition() {
    clearTimeout(transitionTimer);
    if (state.currentQuestion >= QUESTIONS.length) {
      showLoadingThenResult();
    } else {
      renderQuestion(state.currentQuestion);
    }
  }

  function goBack() {
    if (state.currentQuestion === 0) return;
    state.currentQuestion -= 1;
    saveState(state);
    renderQuestion(state.currentQuestion);
  }

  function showLoadingThenResult() {
    showScreen("loading");
    setTimeout(function () {
      renderResult();
    }, 2200);
  }

  function getTemperatura() {
    var q5 = state.answers.q5;
    if (q5 === "agora") return "quente";
    if (q5 === "duvidas") return "morno";
    if (q5 === "pesquisando") return "frio";
    return "";
  }

  function renderResult() {
    var btn = document.getElementById("btnFinal");
    btn.textContent = CFG.buttonText || "Continuar";

    var warning = document.getElementById("redirectWarning");
    var urlNotConfigured = !CFG.redirectUrl || CFG.redirectUrl.indexOf("COLE-AQUI") !== -1;
    if (urlNotConfigured && isDebug) {
      warning.hidden = false;
    }

    btn.onclick = function () {
      handleFinalClick(urlNotConfigured);
    };

    showScreen("result");
    renderDebugPanel();
  }

  function handleFinalClick(urlNotConfigured) {
    var temperatura = getTemperatura();

    trackEvent("Lead", { temperatura: temperatura }, { eventID: state.leadId });

    sendWebhook(temperatura);

    if (isDebug) {
      // em modo debug nunca redireciona, só mostra a URL final
      renderDebugPanel();
      return;
    }

    if (urlNotConfigured) {
      // evita quebrar a página se o link não foi configurado ainda
      return;
    }

    var finalUrl = buildRedirectUrl();

    // aguarda no máximo 300ms pelo evento do pixel, mas redireciona de todo jeito
    setTimeout(function () {
      window.location.href = finalUrl;
    }, 300);
  }

  // ----------------------------------------------------------
  // Construção da URL final (link de campanha + rastreamento)
  // ----------------------------------------------------------
  function buildRedirectUrl() {
    var base;
    try {
      base = new URL(CFG.redirectUrl);
    } catch (e) {
      return CFG.redirectUrl || "#";
    }

    // 1. Parâmetros que já existem no link de campanha configurado (vencem sempre)
    var configuredKeys = {};
    base.searchParams.forEach(function (value, key) {
      configuredKeys[key] = true;
    });

    function addIfAbsent(key, value) {
      if (!value) return;
      if (configuredKeys[key]) return; // o do link configurado vence
      base.searchParams.set(key, value);
    }

    // 2. Parâmetros de rastreamento capturados na chegada
    Object.keys(state.trackingParams).forEach(function (key) {
      addIfAbsent(key, state.trackingParams[key]);
    });

    // 3. fbc / fbp / lead_id
    addIfAbsent("fbc", getCookie("_fbc"));
    addIfAbsent("fbp", getCookie("_fbp"));
    addIfAbsent("lead_id", state.leadId);

    // 4. Respostas do quiz, se configurado para isso
    if (CFG.sendAnswersInUrl) {
      Object.keys(state.answers).forEach(function (key) {
        addIfAbsent(key, state.answers[key]);
      });
      addIfAbsent("temperatura", getTemperatura());
    }

    return base.toString();
  }

  // ----------------------------------------------------------
  // Webhook opcional
  // ----------------------------------------------------------
  function sendWebhook(temperatura) {
    var webhookUrl = CFG.webhookUrl && CFG.webhookUrl.trim();
    if (!webhookUrl) return;

    var payload = {
      lead_id: state.leadId,
      tracking: state.trackingParams,
      fbc: getCookie("_fbc"),
      fbp: getCookie("_fbp"),
      answers: state.answers,
      temperatura: temperatura,
      entry_url: window.location.href,
      referrer: document.referrer || "",
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    var body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        var ok = navigator.sendBeacon(webhookUrl, blob);
        if (ok) return;
      }
    } catch (e) {
      /* cai no fallback abaixo */
    }

    try {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true
      });
    } catch (e) {
      /* nunca bloqueia o redirecionamento por causa do webhook */
    }
  }

  // ----------------------------------------------------------
  // Painel de debug
  // ----------------------------------------------------------
  function renderDebugPanel() {
    if (!isDebug) return;
    var panel = document.getElementById("debugPanel");
    panel.hidden = false;

    var finalUrlPreview = "(abra a tela de resultado para ver)";
    try {
      finalUrlPreview = buildRedirectUrl();
    } catch (e) {
      finalUrlPreview = "erro ao montar URL: " + e.message;
    }

    panel.innerHTML =
      "<h3>🔧 Painel de debug</h3>" +
      "<pre><b>lead_id:</b> " + escapeHtml(state.leadId) + "</pre>" +
      "<pre><b>_fbc:</b> " + escapeHtml(getCookie("_fbc") || "(nenhum)") + "</pre>" +
      "<pre><b>_fbp:</b> " + escapeHtml(getCookie("_fbp") || "(nenhum)") + "</pre>" +
      "<pre><b>pixel detectado:</b> " + escapeHtml(pixelMode) + "</pre>" +
      "<pre><b>parâmetros capturados:</b>\n" + escapeHtml(JSON.stringify(state.trackingParams, null, 2)) + "</pre>" +
      "<pre><b>respostas:</b>\n" + escapeHtml(JSON.stringify(state.answers, null, 2)) + "</pre>" +
      "<pre><b>eventos disparados:</b>\n" + escapeHtml(JSON.stringify(firedEvents, null, 2)) + "</pre>" +
      "<pre><b>URL final:</b>\n" + escapeHtml(finalUrlPreview) + "</pre>" +
      "<button type=\"button\" id=\"btnCopyUrl\">Copiar URL</button>";

    var copyBtn = document.getElementById("btnCopyUrl");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var textToCopy = finalUrlPreview;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy);
        }
        copyBtn.textContent = "Copiado!";
        setTimeout(function () { copyBtn.textContent = "Copiar URL"; }, 1500);
      });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ----------------------------------------------------------
  // Eventos de inicialização
  // ----------------------------------------------------------
  document.getElementById("btnStart").addEventListener("click", function () {
    trackEvent("QuizStart");
    if (state.currentQuestion >= QUESTIONS.length) {
      showLoadingThenResult();
    } else {
      renderQuestion(state.currentQuestion);
    }
  });

  document.getElementById("btnBack").addEventListener("click", goBack);

  document.getElementById("btnContinue").addEventListener("click", advanceFromTransition);

  // Retomar de onde parou: se já havia progresso, oferece continuar direto
  // (a tela de abertura some e vai direto para a pergunta/resultado atual)
  if (state.currentQuestion > 0 && Object.keys(state.answers).length > 0) {
    var introCard = screens.intro.querySelector(".card");
    var resumeNote = document.createElement("p");
    resumeNote.className = "subtitle";
    resumeNote.style.marginTop = "-12px";
    resumeNote.textContent = "Você já respondeu " + Object.keys(state.answers).length + " de " + QUESTIONS.length + " perguntas. Continue de onde parou!";
    introCard.insertBefore(resumeNote, introCard.querySelector(".btn-primary"));

    var restartBtn = document.createElement("button");
    restartBtn.type = "button";
    restartBtn.className = "btn-back";
    restartBtn.style.position = "static";
    restartBtn.style.marginTop = "12px";
    restartBtn.textContent = "Recomeçar do zero";
    restartBtn.addEventListener("click", function () {
      state.answers = {};
      state.currentQuestion = 0;
      saveState(state);
      window.location.reload();
    });
    introCard.appendChild(restartBtn);
  }

  renderDebugPanel();
})();
