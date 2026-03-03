#!/usr/bin/env node
/**
 * Minimal production server for platform/app/dist.
 * Uses only Node built-ins (no path-to-regexp / serve) to avoid dependency conflicts.
 * Serves static files and falls back to index.html for SPA routes.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'platform', 'app', 'dist');
const PORT = Number(process.env.PORT) || 3000;

// Warn at startup if dist is missing or empty
const indexHtml = path.join(DIST, 'index.html');
if (!fs.existsSync(indexHtml)) {
  console.error(
    `[serve-dist] ERROR: ${indexHtml} not found. Run "yarn build:production" from repo root first.`
  );
  process.exit(1);
}

const MIMES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  // Strip leading slash so path.join(DIST, ...) never gets an absolute path
  const relativePath = url.replace(/^\//, '') || 'index.html';
  const filePath = path.resolve(DIST, relativePath);

  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const indexPath = path.join(DIST, 'index.html');
        fs.readFile(indexPath, (err2, indexData) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexData);
        });
        return;
      }
      res.writeHead(500);
      res.end('Internal error');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIMES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving ${DIST} at http://localhost:${PORT}`);
});
