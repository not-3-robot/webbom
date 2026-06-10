const http = require('http');
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(__dirname);
const PORT = 9001;
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.csv':'text/csv; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg' };

http.createServer((req, res) => {
  try {
    // 只取路徑部分，丟棄 query string 與 fragment
    const urlPath = req.url.split('?')[0].split('#')[0];
    // 規範化路徑，防止 ../ 遍歷攻擊
    const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    const fp = path.join(DIR, safePath === '/' || safePath === '' ? '/index.html' : safePath);

    // 確保最終路徑仍在專案目錄內
    if (!fp.startsWith(DIR + path.sep) && fp !== DIR + '/index.html' && fp !== DIR + '\\index.html') {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    // 安全標頭
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    fs.readFile(fp, (e, d) => {
      if (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        const ext = path.extname(fp).toLowerCase();
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
        res.end(d);
      }
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
}).listen(PORT, '0.0.0.0', () => console.log('HTTP :' + PORT));
