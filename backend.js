/**
 * MethodWise AI - Dedicated Backend Server & REST API Module
 * File: backend.js
 * 
 * Provides HTTP REST API Endpoints, Database Services, and Real-Time Wi-Fi Data Synchronization
 * for Web and Mobile Applications on Port 8080 (bound to 0.0.0.0 & 192.168.1.7).
 */

const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const url = require('url');
const otpEmailService = require('./email-service.js');

function getActiveWifiIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal && !name.toLowerCase().includes('vmnet')) {
        return net.address;
      }
    }
  }
  return '192.168.1.8';
}

class MethodWiseBackend {
  constructor() {
    this.port = 8080;
    this.host = '0.0.0.0';
    this.wifiIp = getActiveWifiIp();
    this.dbFolder = path.join(__dirname, 'database');
    this.ensureDbFolderExists();
    this.database = this.loadDatabase();
    this.otpStore = {};
  }

  ensureDbFolderExists() {
    if (!fs.existsSync(this.dbFolder)) {
      fs.mkdirSync(this.dbFolder, { recursive: true });
    }
    const projectsFolder = path.join(this.dbFolder, 'projects');
    if (!fs.existsSync(projectsFolder)) {
      fs.mkdirSync(projectsFolder, { recursive: true });
    }
  }

  loadDatabase() {
    let projects = [];
    let favorites = ["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"];
    let settings = { theme: 'dark', pushNotifications: true };
    let users = [{ id: 'usr-1', name: 'Engineering Lead', email: 'engineer@methodwise.ai' }];

    try {
      const projectsFile = path.join(this.dbFolder, 'projects.json');
      if (fs.existsSync(projectsFile)) {
        projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
      }
      const favsFile = path.join(this.dbFolder, 'favorites.json');
      if (fs.existsSync(favsFile)) {
        favorites = JSON.parse(fs.readFileSync(favsFile, 'utf8'));
      }
      const settingsFile = path.join(this.dbFolder, 'settings.json');
      if (fs.existsSync(settingsFile)) {
        settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      }
      const usersFile = path.join(this.dbFolder, 'users.json');
      if (fs.existsSync(usersFile)) {
        users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading database folder files:', e.message);
    }

    return { projects, favorites, settings, users };
  }

  saveDatabase() {
    try {
      this.ensureDbFolderExists();
      fs.writeFileSync(path.join(this.dbFolder, 'projects.json'), JSON.stringify(this.database.projects, null, 2), 'utf8');
      fs.writeFileSync(path.join(this.dbFolder, 'favorites.json'), JSON.stringify(this.database.favorites, null, 2), 'utf8');
      fs.writeFileSync(path.join(this.dbFolder, 'settings.json'), JSON.stringify(this.database.settings, null, 2), 'utf8');
      fs.writeFileSync(path.join(this.dbFolder, 'users.json'), JSON.stringify(this.database.users, null, 2), 'utf8');
      
      const fullSnapshot = {
        databaseName: "MethodWise AI Database",
        version: "1.0.0",
        lastUpdated: new Date().toISOString().split('T')[0],
        ...this.database
      };
      fs.writeFileSync(path.join(this.dbFolder, 'database.json'), JSON.stringify(fullSnapshot, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving database to folder:', e.message);
    }
  }

  saveIndividualProjectFile(project) {
    try {
      const projFolder = path.join(this.dbFolder, 'projects');
      if (!fs.existsSync(projFolder)) fs.mkdirSync(projFolder, { recursive: true });
      fs.writeFileSync(path.join(projFolder, `${project.id}.json`), JSON.stringify(project, null, 2), 'utf8');
    } catch (e) {}
  }

  deleteIndividualProjectFile(id) {
    try {
      const file = path.join(this.dbFolder, 'projects', `${id}.json`);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (e) {}
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
                this.saveIndividualProjectFile(project);
                this.saveDatabase();
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
            if (id) this.deleteIndividualProjectFile(id);
            this.saveDatabase();
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
                if (data.favorites) {
                  this.database.favorites = data.favorites;
                  this.saveDatabase();
                }
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

        // --- AUTH & OTP FORGOT PASSWORD ENDPOINTS ---
        if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const email = (data.email || '').trim().toLowerCase();
              if (!email || !email.includes('@')) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'A valid email address is required.' }));
                return;
              }

              // Generate 6-digit numeric OTP code
              const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
              const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

              this.otpStore[email] = { code: otpCode, expiresAt };

              console.log(`\n=======================================================`);
              console.log(`[AUTHENTICATION SERVICE] OTP Request Received`);
              console.log(` Target Email: ${email}`);
              console.log(` Generated OTP Code: ${otpCode}`);
              console.log(`=======================================================\n`);

              // Dispatch email to target recipient address
              const mailResult = await otpEmailService.sendOtpEmail(email, otpCode);

              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                message: `OTP successfully sent to ${email}`,
                email: email,
                otp: otpCode,
                mailStatus: mailResult
              }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
            }
          });
          return;
        }

        if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const email = (data.email || '').trim().toLowerCase();
              const otp = (data.otp || '').trim();

              const record = this.otpStore[email];
              if (!record) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'No OTP request found for this email address. Please request a new code.' }));
                return;
              }

              if (Date.now() > record.expiresAt) {
                delete this.otpStore[email];
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'OTP code has expired. Please request a new code.' }));
                return;
              }

              if (record.code !== otp) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Incorrect OTP code. Please check your email and try again.' }));
                return;
              }

              res.writeHead(200);
              res.end(JSON.stringify({ success: true, message: 'OTP verified successfully!' }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
            }
          });
          return;
        }

        if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const email = (data.email || '').trim().toLowerCase();
              const otp = (data.otp || '').trim();
              const newPassword = data.newPassword || '';

              if (!newPassword || newPassword.length < 4) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Password must be at least 4 characters long.' }));
                return;
              }

              const record = this.otpStore[email];
              if (!record || record.code !== otp || Date.now() > record.expiresAt) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid or expired OTP session.' }));
                return;
              }

              // Find or update user in database
              let user = this.database.users.find(u => u.email.toLowerCase() === email);
              if (user) {
                user.password = newPassword;
                user.lastPasswordReset = new Date().toISOString();
              } else {
                user = {
                  id: `usr-${Date.now().toString().slice(-4)}`,
                  name: email.split('@')[0],
                  email: email,
                  password: newPassword,
                  role: 'User'
                };
                this.database.users.push(user);
              }

              this.saveDatabase();
              delete this.otpStore[email];

              console.log(`[AUTH SERVICE] Password reset successful for ${email}`);

              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                message: 'Password updated successfully! You can now log in with your new password.',
                user: user
              }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
            }
          });
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
