// ============================================================
// CONFIGURAÇÃO DO QUIZ — edite somente este arquivo
// Depois de editar, salve e suba a alteração (commit + push)
// ============================================================
window.QUIZ_CONFIG = {
  // Link para onde a pessoa vai no final do quiz.
  // Cole aqui o link da sua campanha (WhatsApp, página de vendas etc).
  // Pode já ter parâmetros (ex: ?x=1), o quiz respeita e não apaga.
  redirectUrl: "https://COLE-AQUI-O-LINK-DA-CAMPANHA",

  // Texto do botão final
  buttonText: "Falar agora no WhatsApp e começar",

  // ID do Pixel do Facebook (só os números, ex: "123456789012345").
  // Deixe vazio ("") para desativar o carregamento automático do pixel.
  metaPixelId: "",

  // Repassar as respostas do quiz como parâmetros na URL final?
  // (perfil, motivacao, desafio, divulgacao, faturamento_atual, meta, momento e temperatura)
  // true = sim, false = não.
  sendAnswersInUrl: true,

  // Opcional: URL que recebe os dados completos do lead via POST
  // (ex: um webhook do n8n, Make, ou da sua plataforma de automação).
  // Os dados chegam como campos de formulário (lead_id, temperatura, perfil,
  // desafio, meta, utm_*, fbc, fbp...) e também todos juntos no campo "json",
  // que inclui o texto de cada resposta (answer_labels).
  // Deixe vazio ("") para desativar.
  webhookUrl: ""
};
