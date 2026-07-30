/**
 * MethodWise AI - Shared Local Network Server & Synchronization API
 * Serves Web & Mobile App at http://192.168.1.7:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const HOST = '0.0.0.0'; // Accessible on 192.168.1.7 & local network

// In-Memory Database Store (shared between Web & Mobile App)
let db = {
  session: { isLoggedIn: true, user: { name: 'Engineering Lead', email: 'engineer@methodwise.ai' } },
  projects: [
    {
      id: 'proj-8842',
      name: 'Smart Helmet Outer Shell',
      type: 'Consumer Electronics',
      date: new Date().toISOString().split('T')[0],
      material: 'ABS Plastic',
      process: 'Injection Molding',
      costRange: '₹420 - ₹540',
      unitCost: 480,
      score: 9.4
    }
  ],
  favorites: ["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"],
  settings: { theme: 'dark', pushNotifications: true }
};

// MIME Types Map
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS for mobile app & web requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // --- API Endpoints for Web & Mobile Synchronization ---
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    if (pathname === '/api/projects') {
      if (req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(db.projects));
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const project = JSON.parse(body);
            const existingIdx = db.projects.findIndex(p => p.id === project.id);
            if (existingIdx >= 0) {
              db.projects[existingIdx] = { ...db.projects[existingIdx], ...project };
            } else {
              db.projects.unshift(project);
            }
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, projects: db.projects }));
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else if (req.method === 'DELETE') {
        const id = parsedUrl.query.id;
        db.projects = db.projects.filter(p => p.id !== id);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, projects: db.projects }));
      }
      return;
    }

    if (pathname === '/api/favorites') {
      if (req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(db.favorites));
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.favorites) db.favorites = data.favorites;
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, favorites: db.favorites }));
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      }
      return;
    }
  }

  // --- Static Web & Mobile File Serving ---
  let filePath = '.' + pathname;
  if (filePath === './') filePath = './index.html';

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Error: ' + error.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` MethodWise AI Network Server Running!`);
  console.log(` Web App URL:    http://192.168.1.7:${PORT}`);
  console.log(` Mobile App URL: http://192.168.1.7:${PORT}/mobile/index.html`);
  console.log(`=======================================================`);
});
