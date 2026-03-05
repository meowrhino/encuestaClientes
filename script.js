(() => {
  const API_BASE = 'https://encuesta-worker.manuellatourf.workers.dev';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let currentDomain = '';
  const ratings = {};

  // --- Notifications ---

  function showNotification(message, type = 'info') {
    const el = $('#notification');
    el.textContent = message;
    el.className = `notification notification-${type} show`;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // --- Steps ---

  function showStep(id) {
    $$('.step').forEach(s => s.classList.remove('active'));
    $(`#${id}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Domain Validation ---

  async function validateDomain() {
    const raw = $('#domainInput').value.trim();
    if (!raw) {
      showNotification(t('enterDomain'), 'error');
      return;
    }

    const btn = $('#btnValidate');
    btn.disabled = true;
    btn.textContent = '...';

    try {
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: raw }),
      });

      const data = await res.json();

      if (data.valid) {
        currentDomain = raw;
        $('#surveyDomain').textContent = raw;
        showStep('stepSurvey');
      } else {
        showNotification(data.error || 'error', 'error');
      }
    } catch {
      showNotification(t('connectionError'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = t('enter');
    }
  }

  // --- Rating Buttons ---

  function initRatingButtons() {
    $$('.rating-buttons').forEach(group => {
      const question = group.dataset.question;
      group.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          ratings[question] = parseInt(btn.dataset.value, 10);
        });
      });
    });
  }

  // --- Submit ---

  async function submitSurvey() {
    const QUESTIONS = ['general', 'trato', 'diseno', 'proceso', 'resultado'];

    for (const q of QUESTIONS) {
      if (ratings[q] === undefined) {
        showNotification(t('selectAll'), 'error');
        return;
      }
    }

    const comments = {};
    QUESTIONS.forEach(q => {
      const ta = $(`textarea[data-comment="${q}"]`);
      comments[q] = ta ? ta.value.trim() : '';
    });

    const btn = $('#btnSubmit');
    btn.disabled = true;
    btn.textContent = t('submitting');

    try {
      const res = await fetch(`${API_BASE}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: currentDomain, ratings, comments }),
      });

      const data = await res.json();

      if (data.couponCode) {
        $('#couponCode').textContent = data.couponCode;
        showStep('stepCoupon');
        showNotification(t('surveySent'), 'success');
      } else {
        showNotification(data.error || t('submitError'), 'error');
      }
    } catch {
      showNotification(t('connectionError'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = t('submit');
    }
  }

  // --- Download Coupon ---

  function downloadCoupon() {
    const code = $('#couponCode').textContent;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 400);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 760, 360);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('discount'), 400, 130);

    ctx.font = '600 28px monospace';
    ctx.fillText(code, 400, 200);

    ctx.fillStyle = '#999999';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(t('couponImageText'), 400, 270);

    ctx.fillStyle = '#cccccc';
    ctx.font = '14px Georgia, serif';
    ctx.fillText('meowrhino.studio', 400, 350);

    const link = document.createElement('a');
    link.download = `cupon-${code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification(t('couponDownloaded'), 'success');
  }

  // --- Init ---

  $('#btnValidate').addEventListener('click', validateDomain);
  $('#domainInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') validateDomain();
  });
  $('#btnSubmit').addEventListener('click', submitSurvey);
  $('#btnDownload').addEventListener('click', downloadCoupon);
  initRatingButtons();
  initLangSelector();
})();
