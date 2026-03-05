(() => {
  const API_BASE = 'https://encuesta-worker.manuellatourf.workers.dev';
  const $ = (s) => document.querySelector(s);

  function showNotification(message, type = 'info') {
    const el = $('#notification');
    el.textContent = message;
    el.className = `notification notification-${type} show`;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 3000);
  }

  async function verifyCoupon() {
    const code = $('#codeInput').value.trim().toUpperCase();
    if (!code) {
      showNotification(t('enterCode'), 'error');
      return;
    }

    const btn = $('#btnVerify');
    btn.disabled = true;
    btn.textContent = '...';

    const result = $('#verifyResult');
    result.style.display = 'none';
    result.className = 'verify-result';

    try {
      const res = await fetch(`${API_BASE}/api/verify?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      result.style.display = 'block';

      if (!data.valid) {
        result.classList.add('verify-invalid');
        $('#resultStatus').textContent = t('couponInvalid');
        $('#resultDetail').textContent = t('couponInvalidDetail');
      } else if (data.used) {
        result.classList.add('verify-used');
        $('#resultStatus').textContent = t('couponUsed');
        $('#resultDetail').textContent = `${t('couponUsedAt')} ${new Date(data.usedAt).toLocaleDateString(currentLang === 'en' ? 'en-GB' : currentLang === 'ca' ? 'ca-ES' : 'es-ES')}`;
      } else {
        result.classList.add('verify-valid');
        $('#resultStatus').textContent = t('couponValid');
        $('#resultDetail').textContent = t('couponValidDetail');
      }
    } catch {
      showNotification(t('connectionError'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = t('verify');
    }
  }

  $('#btnVerify').addEventListener('click', verifyCoupon);
  $('#codeInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyCoupon();
  });
  initLangSelector();
})();
