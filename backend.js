/**
 * MethodWise AI - Dedicated Backend Server & REST API Module
 * File: backend.js
 * 
 * Provides HTTP REST API Endpoints, Database Services, and Real-Time Wi-Fi Data Synchronization
 * for Web and Mobile Applications on Port 8080 (bound to 0.0.0.0 & 192.168.1.7).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class MethodWiseBackend {
  constructor() {
    this.port = 8080;
    this.host = '0.0.0.0';
    this.wifiIp = '192.168.1.7';
    this.database = {
      projects: [
        {
          id: 'proj-8842',
          name: 'Smart Board',
          type: 'Consumer Electronics',
          date: new Date().toISOString().split('T')[0],
          material: 'ABS Plastic',
          process: 'Injection Molding',
          costRange: '₹500 - ₹900',
          unitCost: 650,
          score: 9.4
        }
      ],
      favorites: ["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"],
      settings: { theme: 'dark', pushNotifications: true }
    };
  }

  startServer() {
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.svg': 'image/svg+xml'
    };

    const server = http.createServer((req, res) => {
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

      // Backend REST API Service Routes
      if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/api/projects') {
          if (req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(this.database.projects));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const project = JSON.parse(body);
                const idx = this.database.projects.findIndex(p => p.id === project.id);
                if (idx >= 0) {
                  this.database.projects[idx] = { ...this.database.projects[idx], ...project };
                } else {
                  this.database.projects.unshift(project);
                }
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, projects: this.database.projects }));
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON Payload' }));
              }
            });
          } else if (req.method === 'DELETE') {
            const id = parsedUrl.query.id;
            this.database.projects = this.database.projects.filter(p => p.id !== id);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, projects: this.database.projects }));
          }
          return;
        }

        if (pathname === '/api/favorites') {
          if (req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(this.database.favorites));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (data.favorites) this.database.favorites = data.favorites;
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, favorites: this.database.favorites }));
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON Payload' }));
              }
            });
          }
          return;
        }
      }

      // Serve Static Application Files
      let filePath = '.' + pathname;
      if (filePath === './') filePath = './index.html';

      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Backend File Not Found</h1>', 'utf-8');
          } else {
            res.writeHead(500);
            res.end('Backend Server Error: ' + error.code, 'utf-8');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(this.port, this.host, () => {
      console.log(`=======================================================`);
      console.log(`       MethodWise AI Dedicated Backend Server          `);
      console.log(`=======================================================`);
      console.log(` Backend Service Host: http://${this.wifiIp}:${this.port}`);
      console.log(` Web App Target:      http://${this.wifiIp}:${this.port}/index.html`);
      console.log(` Mobile App Target:   http://${this.wifiIp}:${this.port}/mobile/index.html`);
      console.log(`=======================================================`);
    });
  }
}

const backend = new MethodWiseBackend();
backend.startServer();
