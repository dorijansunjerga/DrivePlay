/**
 * DrivePlay Cloudflare Worker
 *
 * KV bindings:  DP_KV
 * Secret:       API_KEY  (wrangler secret put API_KEY)
 *
 * Endpoints:
 *   GET  /brands          — returns brands array (public)
 *   POST /brands          — saves brands array   (requires X-API-Key header)
 *   GET  /screens         — returns screens array (public)
 *   POST /screens         — saves screens array  (requires X-API-Key header)
 *   GET  /health          — returns {ok:true, ts}
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function raw(text, status = 200) {
  return new Response(text, {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function unauthorized() {
  return json({ error: 'Unauthorized' }, 401);
}

function notFound() {
  return json({ error: 'Not found' }, 404);
}

function checkAuth(request, env) {
  return request.headers.get('X-API-Key') === env.API_KEY;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Health check
    if (path === '/health') {
      return json({ ok: true, ts: Date.now() });
    }

    // Brands
    if (path === '/brands') {
      if (request.method === 'GET') {
        const data = (await env.DP_KV.get('dp_brands_v2')) ?? '[]';
        return raw(data);
      }
      if (request.method === 'POST') {
        if (!checkAuth(request, env)) return unauthorized();
        const body = await request.text();
        try { JSON.parse(body); } catch { return json({ error: 'Invalid JSON' }, 400); }
        await env.DP_KV.put('dp_brands_v2', body);
        return json({ ok: true });
      }
    }

    // Screens
    if (path === '/screens') {
      if (request.method === 'GET') {
        const data = (await env.DP_KV.get('dp_screens_v1')) ?? '[]';
        return raw(data);
      }
      if (request.method === 'POST') {
        if (!checkAuth(request, env)) return unauthorized();
        const body = await request.text();
        try { JSON.parse(body); } catch { return json({ error: 'Invalid JSON' }, 400); }
        await env.DP_KV.put('dp_screens_v1', body);
        return json({ ok: true });
      }
    }

    return notFound();
  },
};
