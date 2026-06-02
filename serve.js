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
  let filePath = path.join(DIR, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
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
