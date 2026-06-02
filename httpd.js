const http = require('http');
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const PORT = 9001;
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.csv':'text/csv; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg' };
http.createServer((req, res) => {
  let fp = path.join(DIR, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  fs.readFile(fp, (e, d) => { if(e){res.writeHead(404);res.end('404');}else{res.writeHead(200,{'Content-Type':MIME[path.extname(fp).toLowerCase()]||'application/octet-stream'});res.end(d);} });
}).listen(PORT,'0.0.0.0',()=>console.log('HTTP :'+PORT));
