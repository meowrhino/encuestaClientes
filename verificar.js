(() => {
  const API_BASE = 'https://encuesta-worker.meowrhino.workers.dev';
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
      showNotification('introduce un código', 'error');
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
        $('#resultStatus').textContent = 'cupón no válido';
        $('#resultDetail').textContent = 'este código no existe en nuestro sistema';
      } else if (data.used) {
        result.classList.add('verify-used');
        $('#resultStatus').textContent = 'cupón ya canjeado';
        $('#resultDetail').textContent = `canjeado el ${new Date(data.usedAt).toLocaleDateString('es-ES')}`;
      } else {
        result.classList.add('verify-valid');
        $('#resultStatus').textContent = 'cupón válido';
        $('#resultDetail').textContent = '5% de descuento · disponible para usar';
      }
    } catch {
      showNotification('error de conexión', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'verificar';
    }
  }

  $('#btnVerify').addEventListener('click', verifyCoupon);
  $('#codeInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyCoupon();
  });
})();
