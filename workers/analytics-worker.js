// WebBOM Analytics — Cloudflare Worker + KV
// 接收事件、儲存至 KV、提供彙總 API

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // POST /event — 寫入事件
    if (request.method === 'POST' && url.pathname === '/event') {
      try {
        const payload = await request.json();
        const ts = Date.now();
        const key = `event:${ts}:${Math.random().toString(36).slice(2, 8)}`;
        await env.ANALYTICS.put(key, JSON.stringify(payload));
        // 自動過期：90 天後刪除
        await env.ANALYTICS.put(`expire:${key}`, '', { expirationTtl: 7776000 });
        return new Response(JSON.stringify({ ok: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 400, headers });
      }
    }

    // GET /stats — 彙總統計
    if (request.method === 'GET' && url.pathname === '/stats') {
      const list = await env.ANALYTICS.list({ prefix: 'event:' });
      const events = [];
      for (const k of list.keys) {
        const raw = await env.ANALYTICS.get(k.name);
        if (raw) events.push(JSON.parse(raw));
      }

      const summary = {
        total: events.length,
        pageviews: 0,
        selects: 0,
        inquiries: 0,
        errors: 0,
        devices: {},
        products: {},
        topParts: {},
        recentErrors: []
      };

      events.forEach(e => {
        if (e.type === 'pageview') summary.pageviews++;
        else if (e.type === 'select') summary.selects++;
        else if (e.type === 'inquiry') summary.inquiries++;
        else if (e.type === 'error') {
          summary.errors++;
          if (summary.recentErrors.length < 20) {
            summary.recentErrors.push({ ts: e.timestamp, msg: e.message, device: e.device });
          }
        }

        if (e.device) summary.devices[e.device] = (summary.devices[e.device] || 0) + 1;
        if (e.product) summary.products[e.product] = (summary.products[e.product] || 0) + 1;

        if (e.type === 'inquiry' && e.partNumbers) {
          e.partNumbers.split('|').forEach(pn => {
            summary.topParts[pn] = (summary.topParts[pn] || 0) + 1;
          });
        }
      });

      return new Response(JSON.stringify(summary), { headers });
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });
  }
};
