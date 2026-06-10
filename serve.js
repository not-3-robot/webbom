// WebBOM - combined HTTP server + localtunnel (with retry & logging)
const http = require('http');
const fs = require('fs');
const path = require('path');
const localtunnel = require('/Users/zone/.npm/_npx/75ac80b86e83d4a2/node_modules/localtunnel');

const DIR = __dirname;
const PORT = 9001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.csv':  'text/csv; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
};

// ---- HTTP server ----
const server = http.createServer((req, res) => {
  try {
    // 只取路徑部分，丟棄 query string 與 fragment
    const urlPath = req.url.split('?')[0].split('#')[0];
    // 規範化路徑，防止 ../ 遍歷攻擊
    const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(DIR, safePath === '/' || safePath === '' ? '/index.html' : safePath);

    // 確保最終路徑仍在專案目錄內
    if (!filePath.startsWith(DIR + path.sep) && filePath !== DIR + '/index.html' && filePath !== DIR + '\\index.html') {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    // 安全標頭
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const ctype = MIME[ext] || 'application/octet-stream';
      // HTML 頁面額外加入 CSP（必須在 writeHead 之前設定）
      if (ext === '.html') {
        res.setHeader('Content-Security-Policy',
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' https://api.qrserver.com data:; " +
          "connect-src 'self'; " +
          "frame-ancestors 'none';"
        );
      }
      res.writeHead(200, { 'Content-Type': ctype });
      res.end(data);
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  process.stdout.write('[' + ts + '] ' + msg + '\n');
}

// ---- Tunnel with retry ----
function startTunnel(retries) {
  retries = retries || 0;
  log('Connecting tunnel (attempt ' + (retries + 1) + ')...');

  const timer = setTimeout(() => {
    log('Tunnel connect TIMEOUT');
    if (retries < 4) {
      setTimeout(() => startTunnel(retries + 1), 3000);
    } else {
      log('Tunnel: all attempts failed, server still running on :' + PORT);
    }
  }, 20000);

  localtunnel({ port: PORT }, (err, tunnel) => {
    clearTimeout(timer);
    if (err) {
      log('Tunnel error: ' + err.message);
      if (retries < 4) {
        setTimeout(() => startTunnel(retries + 1), 3000);
      }
      return;
    }
    log('Tunnel URL: ' + tunnel.url);
    tunnel.on('close', () => {
      log('Tunnel closed, reconnecting...');
      setTimeout(() => startTunnel(0), 3000);
    });
    tunnel.on('error', (e) => {
      log('Tunnel runtime error: ' + (e && e.message));
    });
  });
}

server.listen(PORT, '0.0.0.0', () => {
  log('Server ready on :' + PORT);
  startTunnel(0);
});
