const I18N = {
  es: {
    // Step 1
    surveyTitle: 'encuesta de satisfacción',
    surveySubtitle: 'introduce el dominio de tu web para comenzar',
    enter: 'entrar',
    domainPlaceholder: 'ejemplo.com',
    // Step 2
    tellUs: 'cuéntanos tu experiencia',
    general: 'valoración general',
    trato: 'valoración del trato',
    diseno: 'valoración del diseño',
    proceso: 'valoración del proceso',
    resultado: 'valoración del resultado',
    commentPlaceholder: 'comentario opcional...',
    submit: 'enviar encuesta',
    submitting: 'enviando...',
    // Step 3
    discount: '5% de descuento',
    thanks: 'gracias por tu valoración',
    download: 'descargar cupón',
    // Notifications
    enterDomain: 'introduce un dominio',
    selectAll: 'selecciona una valoración para cada pregunta',
    surveySent: 'encuesta enviada',
    submitError: 'error al enviar',
    connectionError: 'error de conexión',
    couponDownloaded: 'cupón descargado',
    // Verify page
    verifyTitle: 'verificar cupón',
    verifySubtitle: 'introduce el código del cupón para comprobar su validez',
    verify: 'verificar',
    codePlaceholder: 'MR-XXXX-XXXX',
    enterCode: 'introduce un código',
    couponValid: 'cupón válido',
    couponValidDetail: '5% de descuento · disponible para usar',
    couponUsed: 'cupón ya canjeado',
    couponUsedAt: 'canjeado el',
    couponInvalid: 'cupón no válido',
    couponInvalidDetail: 'este código no existe en nuestro sistema',
    // Coupon image
    couponImageText: 'cupón válido para un proyecto en meowrhino.studio',
  },
  en: {
    surveyTitle: 'satisfaction survey',
    surveySubtitle: 'enter your website domain to begin',
    enter: 'enter',
    domainPlaceholder: 'example.com',
    tellUs: 'tell us about your experience',
    general: 'overall rating',
    trato: 'service rating',
    diseno: 'design rating',
    proceso: 'process rating',
    resultado: 'result rating',
    commentPlaceholder: 'optional comment...',
    submit: 'submit survey',
    submitting: 'submitting...',
    discount: '5% discount',
    thanks: 'thank you for your feedback',
    download: 'download coupon',
    enterDomain: 'enter a domain',
    selectAll: 'select a rating for each question',
    surveySent: 'survey submitted',
    submitError: 'error submitting',
    connectionError: 'connection error',
    couponDownloaded: 'coupon downloaded',
    verifyTitle: 'verify coupon',
    verifySubtitle: 'enter the coupon code to check its validity',
    verify: 'verify',
    codePlaceholder: 'MR-XXXX-XXXX',
    enterCode: 'enter a code',
    couponValid: 'valid coupon',
    couponValidDetail: '5% discount · available to use',
    couponUsed: 'coupon already redeemed',
    couponUsedAt: 'redeemed on',
    couponInvalid: 'invalid coupon',
    couponInvalidDetail: 'this code does not exist in our system',
    couponImageText: 'valid coupon for a project at meowrhino.studio',
  },
  ca: {
    surveyTitle: 'enquesta de satisfacció',
    surveySubtitle: 'introdueix el domini del teu web per començar',
    enter: 'entrar',
    domainPlaceholder: 'exemple.com',
    tellUs: 'explica\'ns la teva experiència',
    general: 'valoració general',
    trato: 'valoració del tracte',
    diseno: 'valoració del disseny',
    proceso: 'valoració del procés',
    resultado: 'valoració del resultat',
    commentPlaceholder: 'comentari opcional...',
    submit: 'enviar enquesta',
    submitting: 'enviant...',
    discount: '5% de descompte',
    thanks: 'gràcies per la teva valoració',
    download: 'descarregar cupó',
    enterDomain: 'introdueix un domini',
    selectAll: 'selecciona una valoració per cada pregunta',
    surveySent: 'enquesta enviada',
    submitError: 'error en enviar',
    connectionError: 'error de connexió',
    couponDownloaded: 'cupó descarregat',
    verifyTitle: 'verificar cupó',
    verifySubtitle: 'introdueix el codi del cupó per comprovar la seva validesa',
    verify: 'verificar',
    codePlaceholder: 'MR-XXXX-XXXX',
    enterCode: 'introdueix un codi',
    couponValid: 'cupó vàlid',
    couponValidDetail: '5% de descompte · disponible per usar',
    couponUsed: 'cupó ja bescanviat',
    couponUsedAt: 'bescanviat el',
    couponInvalid: 'cupó no vàlid',
    couponInvalidDetail: 'aquest codi no existeix al nostre sistema',
    couponImageText: 'cupó vàlid per a un projecte a meowrhino.studio',
  },
};

let currentLang = 'es';

function detectLang() {
  const stored = localStorage.getItem('lang');
  if (stored && I18N[stored]) return stored;
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('ca')) return 'ca';
  if (nav.startsWith('en')) return 'en';
  return 'es';
}

function t(key) {
  return I18N[currentLang]?.[key] || I18N.es[key] || key;
}

function setLang(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  if (typeof onLangChange === 'function') onLangChange(lang);
}

function initLangSelector() {
  currentLang = detectLang();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  setLang(currentLang);
}
