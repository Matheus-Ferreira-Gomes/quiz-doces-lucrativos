/* ============================================================
   Quiz Doces Lucrativos — lógica da aplicação
   Você não precisa editar este arquivo: as configurações ficam no config.js
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.QUIZ_CONFIG || {};
  var STORAGE_KEY = "dl_quiz_v1";
  var AUTO_ADVANCE_MS = 4000;   // tempo até a transição avançar sozinha
  var LOADING_MS = 2400;        // duração da tela "Analisando..."
  var LEAD_WAIT_MS = 300;       // espera máxima para o evento Lead sair antes do redirecionamento
  var query = new URLSearchParams(window.location.search);
  var DEBUG = query.get("debug") === "1";

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

  var TEMPERATURA = { agora: "quente", duvidas: "morno", pesquisando: "frio" };

  // ----------------------------------------------------------
  // Estado salvo no navegador (permite retomar de onde parou)
  // ----------------------------------------------------------
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* modo privado: segue sem salvar */ }
  }

  var state = loadState();
  state.answers = state.answers || {};
  state.tracking = state.tracking || {};
  state.step = typeof state.step === "number" ? Math.max(0, Math.min(state.step, QUESTIONS.length)) : 0;
  state.leadId = state.leadId || generateLeadId();

  function nowIso() { return new Date().toISOString(); }

  // lead_id curto e legível, sem caracteres ambíguos (O/0/I/1)
  function generateLeadId() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var bytes = new Uint8Array(5);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var j = 0; j < bytes.length; j++) bytes[j] = Math.floor(Math.random() * 256);
    }
    var out = "";
    for (var i = 0; i < bytes.length; i++) out += chars.charAt(bytes[i] % chars.length);
    return "DL-" + out;
  }

  // ----------------------------------------------------------
  // Cookies
  // ----------------------------------------------------------
  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? m[1] : "";
  }
  function setCookie(name, value, days) {
    document.cookie = name + "=" + value + "; max-age=" + days * 86400 + "; path=/; SameSite=Lax" +
      (location.protocol === "https:" ? "; Secure" : "");
  }
  function getFbc() { return getCookie("_fbc") || state.fbc || ""; }
  function getFbp() { return getCookie("_fbp"); }

  // ----------------------------------------------------------
  // 1. Captura dos parâmetros de chegada (modelo first touch)
  // ----------------------------------------------------------
  // Guarda TODOS os parâmetros da URL. Se já existir um conjunto salvo de
  // uma visita anterior, ele é mantido inteiro (não mistura visitas e uma
  // visita sem parâmetros não apaga nada).
  function captureTracking() {
    var incoming = {};
    query.forEach(function (value, key) {
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
    var fbclid = query.get("fbclid");
    if (fbclid) {
      var fbc = getCookie("_fbc");
      if (fbc.split(".").slice(3).join(".") !== fbclid) {
        fbc = "fb.1." + Date.now() + "." + fbclid;
        setCookie("_fbc", fbc, 90);
      }
      state.fbc = fbc; // cópia de segurança caso o navegador bloqueie cookies
    }

    saveState();
  }

  // ----------------------------------------------------------
  // Pixel do Facebook (pelo ID do config.js ou pelo código colado)
  // ----------------------------------------------------------
  var pixelMode = "não instalado";
  var eventLog = [];

  function setupPixel() {
    // Código completo colado no <head>: ele já fez init + PageView
    if (typeof window.fbq === "function") {
      pixelMode = "código colado no index.html";
      logEvent("PageView", {}, "disparado pelo código colado");
      return;
    }

    var id = String(CFG.metaPixelId || "").trim();
    if (!id) return;
    if (!/^\d+$/.test(id)) {
      pixelMode = "ID inválido no config.js (use só números)";
      return;
    }

    // Fila oficial do fbq: os eventos ficam guardados até o script da Meta carregar
    var n = window.fbq = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments); else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    pixelMode = "ID do config.js (" + id + ")";
    n("init", id);
    track("PageView");

    // Carrega o script da Meta só depois da página pronta, para não atrasar a abertura
    var inject = function () {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    };
    if (document.readyState === "complete") inject(); else window.addEventListener("load", inject);
  }

  // custom = true para eventos personalizados (trackCustom)
  function track(name, data, options, custom) {
    var hasPixel = typeof window.fbq === "function";
    if (hasPixel) {
      var method = custom ? "trackCustom" : "track";
      if (options) window.fbq(method, name, data || {}, options);
      else window.fbq(method, name, data || {});
    }
    logEvent(name, data, hasPixel ? (options && options.eventID ? "eventID " + options.eventID : "enviado") : "sem pixel (não enviado)");
  }

  function logEvent(name, data, note) {
    eventLog.push(new Date().toLocaleTimeString("pt-BR") + "  " + name + " " + JSON.stringify(data || {}) + "  → " + note);
    renderDebug();
  }

  // ----------------------------------------------------------
  // 2. Montagem do link final
  // ----------------------------------------------------------
  // Regras de prioridade quando o mesmo parâmetro aparece em mais de um lugar:
  //   1º o que já está no link configurado em config.js (nunca é sobrescrito)
  //   2º os dados gerados pelo quiz (lead_id, fbc, fbp, respostas, temperatura)
  //   3º os parâmetros que chegaram na URL (fbclid, utm_*, ids de campanha...)
  // Parâmetros vazios nunca são adicionados. A API URL cuida do encode.
  function buildRedirectUrl() {
    var url = new URL(String(CFG.redirectUrl || "").trim());

    function add(key, value) {
      if (value === undefined || value === null || String(value) === "") return;
      if (url.searchParams.has(key)) return; // quem chegou primeiro vence
      url.searchParams.set(key, String(value));
    }

    add("lead_id", state.leadId);
    add("fbc", getFbc());
    add("fbp", getFbp());

    if (CFG.sendAnswersInUrl) {
      QUESTIONS.forEach(function (q) { add(q.id, state.answers[q.id]); });
      add("temperatura", getTemperatura());
    }

    Object.keys(state.tracking).forEach(function (key) { add(key, state.tracking[key]); });

    return url.toString();
  }

  function isRedirectConfigured() {
    var raw = String(CFG.redirectUrl || "").trim();
    if (!raw || /COLE-AQUI/i.test(raw)) return false;
    try {
      var u = new URL(raw);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch (e) {
      return false;
    }
  }

  function getTemperatura() { return TEMPERATURA[state.answers.q5] || ""; }

  function labelFor(questionId) {
    var q = QUESTIONS.filter(function (x) { return x.id === questionId; })[0];
    var opt = q && q.options.filter(function (o) { return o.value === state.answers[questionId]; })[0];
    return opt ? opt.label : "";
  }

  // ----------------------------------------------------------
  // 3. Webhook (opcional)
  // ----------------------------------------------------------
  // Enviado como formulário (application/x-www-form-urlencoded): é o formato
  // que n8n, Make e Zapier leem sem configuração e que o navegador envia sem
  // bloqueio de CORS. O campo "json" traz tudo junto em JSON.
  function sendWebhook(finalUrl) {
    var endpoint = String(CFG.webhookUrl || "").trim();
    if (!endpoint) return;

    var data = {
      lead_id: state.leadId,
      temperatura: getTemperatura(),
      answers: state.answers,
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

    var flat = Object.assign({}, state.tracking, state.answers, data);
    delete flat.answers;
    delete flat.params;

    var form = new URLSearchParams();
    Object.keys(flat).forEach(function (k) { if (flat[k] !== "") form.append(k, flat[k]); });
    form.append("json", JSON.stringify(data));

    var sent = false;
    try { sent = !!(navigator.sendBeacon && navigator.sendBeacon(endpoint, form)); } catch (e) { sent = false; }
    if (!sent) {
      try {
        fetch(endpoint, { method: "POST", body: form, mode: "no-cors", keepalive: true }).catch(function () {});
      } catch (e) { /* nunca bloqueia o redirecionamento */ }
    }
    logEvent("Webhook", { url: endpoint }, sent ? "enviado (sendBeacon)" : "enviado (fetch)");
  }

  // ----------------------------------------------------------
  // Navegação entre telas
  // ----------------------------------------------------------
  function $(id) { return document.getElementById(id); }

  var screens = {
    intro: $("screen-intro"),
    question: $("screen-question"),
    transition: $("screen-transition"),
    loading: $("screen-loading"),
    result: $("screen-result")
  };
  var currentScreen = "intro";
  var lockUntil = 0;
  var autoTimer = null;
  var loadingTimer = null;

  function show(name, moveFocus) {
    clearTimeout(autoTimer);
    clearTimeout(loadingTimer);
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle("active", k === name); });
    currentScreen = name;
    // bloqueia toques por um instante: evita que um toque duplo "atravesse" para a tela seguinte
    lockUntil = Date.now() + 350;
    updateProgress();
    window.scrollTo(0, 0);
    if (moveFocus !== false) {
      var target = screens[name].querySelector("[tabindex='-1']");
      if (target) target.focus({ preventScroll: true });
    }
    renderDebug();
  }

  function guard(fn) {
    return function (e) {
      if (Date.now() < lockUntil) return;
      fn(e);
    };
  }

  function updateProgress() {
    var total = QUESTIONS.length;
    var done = { intro: 0, question: state.step + 1, transition: state.step, loading: total, result: total }[currentScreen];
    $("progressFill").style.width = (done / total) * 100 + "%";
    $("topbar").classList.toggle("visible", currentScreen !== "intro");
  }

  // ---------- Abertura ----------
  function setupIntro() {
    var resuming = state.step > 0 && state.step < QUESTIONS.length;
    $("btnStart").textContent = resuming ? "Continuar de onde parei" : "Começar agora";
    $("resumeNote").hidden = !resuming;
    $("resumeNote").textContent = "Você já respondeu " + state.step + " de " + QUESTIONS.length + " perguntas.";
    $("btnRestart").hidden = !resuming;
  }

  function start() {
    if (!state.startedAt) {
      state.startedAt = nowIso();
      saveState();
      track("QuizStart", {}, null, true);
    }
    if (state.step >= QUESTIONS.length) showLoading();
    else renderQuestion(state.step);
  }

  function restart() {
    state.answers = {};
    state.step = 0;
    state.startedAt = nowIso();
    state.completedAt = "";
    saveState();
    track("QuizStart", { recomeco: true }, null, true);
    renderQuestion(0);
  }

  // ---------- Perguntas ----------
  function renderQuestion(index) {
    var q = QUESTIONS[index];
    state.step = index;
    saveState();

    $("questionTitle").textContent = q.title;
    $("stepLabel").textContent = "Pergunta " + (index + 1) + " de " + QUESTIONS.length;

    var box = $("options");
    box.textContent = "";
    box.classList.remove("locked");
    q.options.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.textContent = opt.label;
      b.setAttribute("aria-pressed", String(state.answers[q.id] === opt.value));
      b.addEventListener("click", guard(function () { selectOption(index, opt.value, b); }));
      box.appendChild(b);
    });

    show("question");
  }

  // Marca a opção escolhida por um instante (feedback visual) e segue
  function selectOption(index, value, btn) {
    var box = $("options");
    if (box.classList.contains("locked")) return;
    box.classList.add("locked");
    Array.prototype.forEach.call(box.children, function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    setTimeout(function () { answer(index, value); }, 180);
  }

  function answer(index, value) {
    var q = QUESTIONS[index];
    state.answers[q.id] = value;
    state.step = index + 1;
    saveState();

    track("QuizStep", { step: index + 1, pergunta: q.id, resposta: value }, null, true);

    $("transitionText").textContent = q.transition;
    show("transition");

    var btn = $("btnContinue");
    btn.classList.remove("counting");
    void btn.offsetWidth; // reinicia a animação da barrinha de contagem
    btn.classList.add("counting");
    autoTimer = setTimeout(advance, AUTO_ADVANCE_MS);
  }

  function advance() {
    if (state.step >= QUESTIONS.length) showLoading();
    else renderQuestion(state.step);
  }

  // Volta uma pergunta. Da pergunta 1, volta para a abertura.
  function goBack() {
    if (currentScreen === "intro") return;
    var target = state.step - 1;
    if (target < 0) {
      setupIntro();
      show("intro");
    } else {
      renderQuestion(target);
    }
  }

  // ---------- Carregando e resultado ----------
  function showLoading() {
    show("loading");
    loadingTimer = setTimeout(function () {
      if (!state.completedAt) {
        state.completedAt = nowIso();
        saveState();
      }
      track("QuizComplete", { temperatura: getTemperatura() }, null, true);
      renderResult();
    }, LOADING_MS);
  }

  function renderResult(moveFocus) {
    var rows = [
      ["O que te move", labelFor("q1")],
      ["Sua meta de faturamento", labelFor("q4") && labelFor("q4") + " por mês"]
    ].filter(function (r) { return r[1]; });

    var profile = $("profile");
    profile.textContent = "";
    rows.forEach(function (r) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = r[0];
      dd.textContent = r[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      profile.appendChild(wrap);
    });
    profile.hidden = rows.length === 0;

    $("redirectWarning").hidden = !(DEBUG && !isRedirectConfigured());
    resetFinalButton();
    show("result", moveFocus);
  }

  var redirecting = false;

  function resetFinalButton() {
    redirecting = false;
    var b = $("btnFinal");
    b.textContent = CFG.buttonText || "Continuar";
    b.classList.remove("is-loading");
    b.removeAttribute("aria-busy");
  }

  // Clique final: Lead no pixel → webhook → redirecionamento
  function onFinalClick() {
    if (redirecting) return;

    var configured = isRedirectConfigured();
    var finalUrl = configured ? buildRedirectUrl() : "";

    state.clickedAt = nowIso();
    saveState();

    // eventID = lead_id para a Meta deduplicar com a API de Conversões
    track("Lead", { temperatura: getTemperatura(), content_name: "Quiz Doces Lucrativos" }, { eventID: state.leadId });
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
    var b = $("btnFinal");
    b.textContent = "Abrindo...";
    b.classList.add("is-loading");
    b.setAttribute("aria-busy", "true");

    // Dá até 300ms para o pixel enviar o Lead; redireciona de qualquer jeito
    setTimeout(function () {
      window.location.href = finalUrl;
    }, typeof window.fbq === "function" ? LEAD_WAIT_MS : 0);
  }

  // ----------------------------------------------------------
  // Botão "voltar" do celular: volta uma pergunta em vez de sair do quiz
  // ----------------------------------------------------------
  var backTrapArmed = false;

  function armBackTrap() {
    if (backTrapArmed || currentScreen === "intro") return;
    try {
      history.pushState({ dlQuiz: true }, "");
      backTrapArmed = true;
    } catch (e) { /* navegador sem suporte: segue normal */ }
  }

  window.addEventListener("popstate", function () {
    backTrapArmed = false;
    if (currentScreen === "intro") return;
    goBack();
    armBackTrap();
  });

  // ----------------------------------------------------------
  // 4. Painel de debug (?debug=1)
  // ----------------------------------------------------------
  var debugBody = null;

  function initDebug() {
    if (!DEBUG) return;
    document.body.classList.add("has-debug");
    var panel = $("debugPanel");
    panel.hidden = false;
    panel.classList.add("collapsed");
    panel.innerHTML =
      '<div class="debug-head"><strong>Modo debug (não redireciona)</strong><span>' +
      '<button type="button" data-act="copy">Copiar URL</button> ' +
      '<button type="button" data-act="reset">Limpar dados</button> ' +
      '<button type="button" data-act="toggle" aria-expanded="false">Expandir</button>' +
      "</span></div><div class=\"debug-body\"></div>";
    debugBody = panel.querySelector(".debug-body");

    panel.addEventListener("click", function (e) {
      var act = e.target.getAttribute && e.target.getAttribute("data-act");
      if (act === "copy") copyText(previewUrl(), e.target);
      if (act === "toggle") {
        var collapsed = panel.classList.toggle("collapsed");
        e.target.textContent = collapsed ? "Expandir" : "Minimizar";
        e.target.setAttribute("aria-expanded", String(!collapsed));
      }
      if (act === "reset") {
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignora */ }
        document.cookie = "_fbc=; max-age=0; path=/";
        location.reload();
      }
    });
  }

  function previewUrl() {
    try { return buildRedirectUrl(); } catch (e) { return "(link inválido no config.js: " + CFG.redirectUrl + ")"; }
  }

  function renderDebug() {
    if (!debugBody) return;
    var rows = [];
    if (!isRedirectConfigured()) {
      rows.push(["Atenção", "redirectUrl ainda não foi configurado no config.js. A URL abaixo usa o texto de exemplo só para mostrar os parâmetros.", "alert"]);
    }
    rows.push(
      ["URL final que seria aberta", previewUrl(), "url"],
      ["lead_id", state.leadId],
      ["temperatura", getTemperatura() || "(responda a pergunta 5)"],
      ["Pixel", pixelMode],
      ["fbc", getFbc() || "(nenhum: só existe quando chega fbclid na URL)"],
      ["fbp", getFbp() || "(nenhum: o cookie _fbp é criado pelo pixel)"],
      ["Parâmetros capturados (first touch)", JSON.stringify(state.tracking, null, 2)],
      ["URL de entrada", state.landingUrl || ""],
      ["Respostas", JSON.stringify(state.answers, null, 2)],
      ["Eventos disparados", eventLog.join("\n") || "(nenhum ainda)"]
    );

    debugBody.textContent = "";
    rows.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "debug-row" + (r[2] === "alert" ? " alert" : "");
      if (r[2] === "url") row.id = "debugUrlRow";
      var b = document.createElement("b");
      var pre = document.createElement("pre");
      b.textContent = r[0];
      pre.textContent = r[1];
      row.appendChild(b);
      row.appendChild(pre);
      debugBody.appendChild(row);
    });
  }

  function openDebugAtUrl() {
    var panel = $("debugPanel");
    panel.classList.remove("collapsed");
    var toggle = panel.querySelector('[data-act="toggle"]');
    toggle.textContent = "Minimizar";
    toggle.setAttribute("aria-expanded", "true");
    renderDebug();
    var row = $("debugUrlRow");
    if (row) {
      row.classList.add("highlight");
      panel.scrollTop = Math.max(0, row.offsetTop - 40);
    }
  }

  function copyText(text, btn) {
    var done = function () {
      btn.textContent = "Copiado!";
      setTimeout(function () { btn.textContent = "Copiar URL"; }, 1500);
    };
    var fallback = function () {
      var ta = document.createElement("textarea");
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
  }

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
  $("btnBack").addEventListener("click", guard(function () {
    goBack();
    if (currentScreen === "intro" && backTrapArmed) {
      backTrapArmed = false;
      history.back();
    }
  }));

  // Ativa a proteção do botão voltar a cada toque dentro do quiz
  document.addEventListener("click", armBackTrap);

  // Se a pessoa voltar do link final pelo "voltar", o botão volta ao normal
  window.addEventListener("pageshow", function (e) { if (e.persisted) resetFinalButton(); });

  // Retomar de onde parou
  if (state.step >= QUESTIONS.length) {
    renderResult(false);
  } else {
    setupIntro();
    show("intro", false);
  }
})();
