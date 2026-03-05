// --- Helpers ---

function corsResponse(allowedOrigin, response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', allowedOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  return new Response(response.body, { status: response.status, headers });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeDomain(raw) {
  let d = String(raw).trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/\/+$/, '');
  return d;
}

async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const COUPON_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCouponCode() {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  let code = 'MR-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += COUPON_CHARS[arr[i] % COUPON_CHARS.length];
  }
  return code;
}

async function withAdmin(request, env, handler) {
  const key = request.headers.get('X-Admin-Key');
  if (!key || key !== env.ADMIN_KEY) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  return handler(request, env);
}

// --- Route Handlers ---

async function handleValidate(request, env) {
  const body = await request.json();
  const domain = normalizeDomain(body.domain || '');
  if (!domain) return jsonResponse({ error: 'dominio requerido' }, 400);

  const hash = await sha256(domain);
  const client = await env.ENCUESTA_KV.get(`client:${hash}`);
  if (!client) return jsonResponse({ valid: false, error: 'dominio no autorizado' }, 403);

  const survey = await env.ENCUESTA_KV.get(`survey:${hash}`);
  if (survey) return jsonResponse({ valid: false, error: 'encuesta ya completada' }, 409);

  return jsonResponse({ valid: true });
}

async function handleSubmit(request, env) {
  const body = await request.json();
  const domain = normalizeDomain(body.domain || '');
  if (!domain) return jsonResponse({ error: 'dominio requerido' }, 400);

  const hash = await sha256(domain);

  const client = await env.ENCUESTA_KV.get(`client:${hash}`);
  if (!client) return jsonResponse({ error: 'dominio no autorizado' }, 403);

  const existing = await env.ENCUESTA_KV.get(`survey:${hash}`);
  if (existing) return jsonResponse({ error: 'encuesta ya completada' }, 409);

  const { ratings, comments } = body;
  const QUESTIONS = ['general', 'trato', 'diseno', 'proceso', 'resultado'];
  const VALID_RATINGS = [0, 2, 4, 6, 8, 10];

  for (const q of QUESTIONS) {
    if (typeof ratings?.[q] !== 'number' || !VALID_RATINGS.includes(ratings[q])) {
      return jsonResponse({ error: `valoracion invalida para ${q}` }, 400);
    }
  }

  let couponCode;
  let attempts = 0;
  do {
    couponCode = generateCouponCode();
    const existingCoupon = await env.ENCUESTA_KV.get(`coupon:${couponCode}`);
    if (!existingCoupon) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return jsonResponse({ error: 'error generando cupon' }, 500);
  }

  const now = new Date().toISOString();

  const surveyData = {
    domain,
    ratings,
    comments: Object.fromEntries(
      QUESTIONS.map(q => [q, String(comments?.[q] || '').slice(0, 1000)])
    ),
    couponCode,
    submittedAt: now,
  };

  const couponData = {
    domain,
    createdAt: now,
    used: false,
    usedAt: null,
  };

  await env.ENCUESTA_KV.put(`survey:${hash}`, JSON.stringify(surveyData));
  await env.ENCUESTA_KV.put(`coupon:${couponCode}`, JSON.stringify(couponData));

  return jsonResponse({ couponCode });
}

async function handleVerify(url, env) {
  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  if (!code) return jsonResponse({ error: 'codigo requerido' }, 400);

  const coupon = await env.ENCUESTA_KV.get(`coupon:${code}`);
  if (!coupon) return jsonResponse({ valid: false });

  const data = JSON.parse(coupon);
  return jsonResponse({ valid: true, used: data.used, usedAt: data.usedAt });
}

async function handleAddClient(request, env) {
  const body = await request.json();
  const domain = normalizeDomain(body.domain || '');
  if (!domain) return jsonResponse({ error: 'dominio requerido' }, 400);

  const hash = await sha256(domain);
  await env.ENCUESTA_KV.put(`client:${hash}`, JSON.stringify({
    domain,
    addedAt: new Date().toISOString(),
  }));

  return jsonResponse({ ok: true });
}

async function handleListClients(request, env) {
  const list = await env.ENCUESTA_KV.list({ prefix: 'client:' });
  const clients = [];
  for (const key of list.keys) {
    const val = await env.ENCUESTA_KV.get(key.name);
    if (val) clients.push(JSON.parse(val));
  }
  return jsonResponse({ clients });
}

async function handleListSurveys(request, env) {
  const list = await env.ENCUESTA_KV.list({ prefix: 'survey:' });
  const surveys = [];
  for (const key of list.keys) {
    const val = await env.ENCUESTA_KV.get(key.name);
    if (val) surveys.push(JSON.parse(val));
  }
  return jsonResponse({ surveys });
}

async function handleListCoupons(request, env) {
  const list = await env.ENCUESTA_KV.list({ prefix: 'coupon:' });
  const coupons = [];
  for (const key of list.keys) {
    const val = await env.ENCUESTA_KV.get(key.name);
    if (val) coupons.push({ code: key.name.replace('coupon:', ''), ...JSON.parse(val) });
  }
  return jsonResponse({ coupons });
}

async function handleRedeem(request, env) {
  const body = await request.json();
  const code = (body.code || '').trim().toUpperCase();
  if (!code) return jsonResponse({ error: 'codigo requerido' }, 400);

  const existing = await env.ENCUESTA_KV.get(`coupon:${code}`);
  if (!existing) return jsonResponse({ error: 'cupon no encontrado' }, 404);

  const data = JSON.parse(existing);
  if (data.used) return jsonResponse({ error: 'cupon ya canjeado' }, 409);

  data.used = true;
  data.usedAt = new Date().toISOString();
  await env.ENCUESTA_KV.put(`coupon:${code}`, JSON.stringify(data));

  return jsonResponse({ ok: true });
}

// --- Main ---

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return corsResponse(allowedOrigin, new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response;

      if (path === '/api/validate' && request.method === 'POST') {
        response = await handleValidate(request, env);
      } else if (path === '/api/submit' && request.method === 'POST') {
        response = await handleSubmit(request, env);
      } else if (path === '/api/verify' && request.method === 'GET') {
        response = await handleVerify(url, env);
      } else if (path === '/api/admin/add-client' && request.method === 'POST') {
        response = await withAdmin(request, env, handleAddClient);
      } else if (path === '/api/admin/clients' && request.method === 'GET') {
        response = await withAdmin(request, env, handleListClients);
      } else if (path === '/api/admin/surveys' && request.method === 'GET') {
        response = await withAdmin(request, env, handleListSurveys);
      } else if (path === '/api/admin/coupons' && request.method === 'GET') {
        response = await withAdmin(request, env, handleListCoupons);
      } else if (path === '/api/admin/redeem' && request.method === 'POST') {
        response = await withAdmin(request, env, handleRedeem);
      } else {
        response = jsonResponse({ error: 'not found' }, 404);
      }

      return corsResponse(allowedOrigin, response);
    } catch {
      return corsResponse(allowedOrigin, jsonResponse({ error: 'internal error' }, 500));
    }
  }
};
