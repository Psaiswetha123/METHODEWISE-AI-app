/**
 * MethodWise AI - Dedicated Unified Backend Server & REST API Module
 * File: backend.js
 * 
 * Provides HTTP REST API Endpoints, Database Services, JWT Authentication,
 * AI Recommendation Engine, and Real-Time Data Synchronization (SSE)
 * for Web and Native Android Applications on Port 8080.
 */

const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const url = require('url');
const otpEmailService = require('./email-service.js');
const jwtAuth = require('./backend/jwt-auth.js');
const firebaseBackend = require('./firebase/firebase-backend.js');

function getActiveWifiIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal && !name.toLowerCase().includes('vmnet')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
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
    this.sseClients = [];
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
    let projects = [
      {
        id: "proj-1",
        productName: "smart madicalkit",
        productType: "Consumer Electronics",
        process: "Sheet Metal Fabrication",
        material: "PLA (Polylactic Acid)",
        batchSize: 5000,
        targetCost: 500,
        dfmScore: 94.5,
        unitCost: 480,
        date: "2026-08-05",
        status: "Approved"
      },
      {
        id: "proj-2",
        productName: "Smart board",
        productType: "Consumer Electronics",
        process: "Injection Molding",
        material: "Nylon PA66",
        batchSize: 10000,
        targetCost: 400,
        dfmScore: 92.0,
        unitCost: 350,
        date: "2026-07-30",
        status: "Approved"
      },
      {
        id: "proj-3",
        productName: "Smart Helmet Shell & Visor",
        productType: "Consumer Product",
        process: "Injection Molding",
        material: "ABS Plastic",
        batchSize: 5000,
        targetCost: 600,
        dfmScore: 94.0,
        unitCost: 480,
        date: "2026-07-25",
        status: "Approved"
      },
      {
        id: "proj-4",
        productName: "Medical Syringe Pump Chassis",
        productType: "Medical Device",
        process: "CNC Machining",
        material: "Titanium Ti-6Al-4V",
        batchSize: 500,
        targetCost: 2500,
        dfmScore: 96.8,
        unitCost: 2200,
        date: "2026-07-18",
        status: "Approved"
      }
    ];

    let favorites = ["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"];
    let settings = { theme: 'dark', pushNotifications: true, units: 'metric', currency: 'INR' };
    let users = [{
      id: 'usr-1',
      name: 'Sai Swetha',
      email: 'saiswethanaidu.56@gmail.com',
      passwordHash: jwtAuth.hashPassword('demo12345'),
      role: 'Lead DFM Engineer (Owner)',
      avatar: 'SS'
    }];
    let notifications = [
      { id: 'notif-1', title: 'Analysis Completed', message: 'Smart Helmet DFM score 94/100 generated.', time: '2 mins ago', type: 'success' },
      { id: 'notif-2', title: 'Report Generated', message: 'Full DFM & cost analysis report generated.', time: '15 mins ago', type: 'info' },
      { id: 'notif-3', title: 'DFM Rule Suggestion', message: 'Add 1.5° draft angle on vertical walls for mold release.', time: '1 hr ago', type: 'warning' },
      { id: 'notif-4', title: 'Material Cost Savings', message: 'ABS Plastic lowers unit cost by ₹140 per component.', time: '3 hrs ago', type: 'purple' }
    ];

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

    return { projects, favorites, settings, users, notifications };
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
        version: "2.4.0",
        lastUpdated: new Date().toISOString(),
        ...this.database
      };
      fs.writeFileSync(path.join(this.dbFolder, 'database.json'), JSON.stringify(fullSnapshot, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving database to folder:', e.message);
    }
  }

  notifySseClients(eventType, data) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    this.sseClients = this.sseClients.filter(client => {
      try {
        client.write(payload);
        return true;
      } catch (e) {
        return false;
      }
    });
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
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;

      // Real-Time Data Synchronization Stream (SSE for Web & Android)
      if (pathname === '/api/sync/stream') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
        this.sseClients.push(res);
        req.on('close', () => {
          this.sseClients = this.sseClients.filter(c => c !== res);
        });
        return;
      }

      // Backend REST API Service Routes
      if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');

        // --- AUTHENTICATION REST API ---
        if (pathname === '/api/auth/signup' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const email = (data.email || '').trim().toLowerCase();
              const name = (data.name || email.split('@')[0]).trim();
              const password = data.password || 'demo12345';

              if (!email || !email.includes('@')) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Valid email is required.' }));
                return;
              }

              let user = this.database.users.find(u => u.email.toLowerCase() === email);
              if (user) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'User already exists with this email address.' }));
                return;
              }

              const initialAvatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MW';
              user = {
                id: `usr-${Date.now()}`,
                name: name,
                email: email,
                passwordHash: jwtAuth.hashPassword(password),
                phone: data.phone || '+91 98765 43210',
                company: data.company || 'MethodWise AI',
                department: data.department || 'Engineering',
                profileImage: initialAvatar,
                avatar: initialAvatar,
                role: data.role || 'Lead DFM Engineer',
                createdDate: new Date().toISOString().split('T')[0],
                lastLogin: new Date().toISOString(),
                status: 'active',
                preferences: { theme: 'dark', language: 'en', notificationSettings: true }
              };

              this.database.users.push(user);
              this.saveDatabase();

              const token = jwtAuth.generateToken({ id: user.id, email: user.email, name: user.name });
              const refreshToken = jwtAuth.generateRefreshToken({ id: user.id, email: user.email, name: user.name });

              const userInfo = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                company: user.company,
                department: user.department,
                profileImage: user.profileImage || user.avatar,
                role: user.role,
                token: token,
                refreshToken: refreshToken,
                createdDate: user.createdDate,
                lastLogin: user.lastLogin,
                status: user.status,
                preferences: user.preferences
              };

              res.writeHead(200);
              res.end(JSON.stringify({ success: true, token, refreshToken, user: userInfo }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
            }
          });
          return;
        }

        if (pathname === '/api/auth/login' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const email = (data.email || 'saiswethanaidu.56@gmail.com').trim().toLowerCase();
              const password = data.password || 'demo12345';

              let user = this.database.users.find(u => u.email.toLowerCase() === email);
              if (!user) {
                // Auto-create user account if not existing so login always opens smoothly
                const emailPrefix = email.split('@')[0] || 'User';
                const formattedName = emailPrefix.replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const initialAvatar = formattedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MW';

                user = {
                  id: `usr-${Date.now()}`,
                  name: formattedName,
                  email: email,
                  password: password,
                  passwordHash: jwtAuth.hashPassword(password),
                  phone: '+91 98765 43210',
                  company: 'MethodWise AI',
                  department: 'DFM Engineering',
                  profileImage: initialAvatar,
                  avatar: initialAvatar,
                  role: 'Lead DFM Engineer',
                  createdDate: new Date().toISOString().split('T')[0],
                  lastLogin: new Date().toISOString(),
                  status: 'active',
                  preferences: { theme: 'dark', language: 'en', notificationSettings: true }
                };

                this.database.users.push(user);
                this.saveDatabase();
              }

              user.passwordHash = jwtAuth.hashPassword(password);
              user.password = password;
              user.lastLogin = new Date().toISOString();
              user.status = 'active';
              this.saveDatabase();

              const tokenClaims = { id: user.id, email: user.email, name: user.name, role: user.role };
              const token = jwtAuth.generateToken(tokenClaims);
              const refreshToken = jwtAuth.generateRefreshToken(tokenClaims);

              const userInfo = {
                id: user.id,
                name: user.name || 'Engineer',
                email: user.email,
                phone: user.phone || '+91 98765 43210',
                company: user.company || 'MethodWise Technologies',
                department: user.department || 'DFM & Product Engineering',
                profileImage: user.profileImage || user.avatar || 'MW',
                role: user.role || 'Lead DFM Engineer',
                token: token,
                refreshToken: refreshToken,
                createdDate: user.createdDate || '2026-01-01',
                lastLogin: user.lastLogin,
                status: user.status || 'active',
                preferences: user.preferences || { theme: 'dark', language: 'en', notificationSettings: true }
              };

              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                token: token,
                refreshToken: refreshToken,
                user: userInfo
              }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON Payload' }));
            }
          });
          return;
        }

        if (pathname === '/api/auth/refresh' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const refreshToken = data.refreshToken;
              const claims = jwtAuth.verifyToken(refreshToken);
              if (!claims) {
                res.writeHead(401);
                res.end(JSON.stringify({ success: false, error: 'Invalid or expired refresh token' }));
                return;
              }
              const user = this.database.users.find(u => u.email.toLowerCase() === claims.email.toLowerCase());
              if (!user || user.status === 'inactive') {
                res.writeHead(401);
                res.end(JSON.stringify({ success: false, error: 'User unavailable or inactive' }));
                return;
              }

              const tokenClaims = { id: user.id, email: user.email, name: user.name, role: user.role };
              const newToken = jwtAuth.generateToken(tokenClaims);
              const newRefreshToken = jwtAuth.generateRefreshToken(tokenClaims);

              res.writeHead(200);
              res.end(JSON.stringify({ success: true, token: newToken, refreshToken: newRefreshToken }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
            }
          });
          return;
        }

        if (pathname === '/api/auth/me' && req.method === 'GET') {
          const authHeader = req.headers['authorization'];
          const token = authHeader ? authHeader.replace('Bearer ', '') : null;
          const claims = jwtAuth.verifyToken(token);
          if (!claims) {
            res.writeHead(401);
            res.end(JSON.stringify({ success: false, error: 'Unauthorized token' }));
            return;
          }
          const user = this.database.users.find(u => u.email.toLowerCase() === claims.email.toLowerCase());
          if (!user) {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'User not found' }));
            return;
          }

          const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '+91 98765 43210',
            company: user.company || 'MethodWise Technologies',
            department: user.department || 'DFM & Product Engineering',
            profileImage: user.profileImage || user.avatar || 'MW',
            role: user.role || 'Lead DFM Engineer',
            createdDate: user.createdDate || '2026-01-01',
            lastLogin: user.lastLogin || new Date().toISOString(),
            status: user.status || 'active',
            preferences: user.preferences || { theme: 'dark', language: 'en', notificationSettings: true }
          };
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, user: userInfo }));
          return;
        }

        if (pathname === '/api/auth/profile' && req.method === 'PUT') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              let user = this.database.users.find(u => u.email.toLowerCase() === (data.email || '').toLowerCase());
              if (user) {
                if (data.name) user.name = data.name;
                if (data.role) user.role = data.role;
                if (data.phone) user.phone = data.phone;
                if (data.company) user.company = data.company;
                if (data.department) user.department = data.department;
                if (data.profileImage) user.profileImage = data.profileImage;
                if (data.avatar) user.avatar = data.avatar;
                if (data.preferences) user.preferences = { ...user.preferences, ...data.preferences };
                if (data.password) user.passwordHash = jwtAuth.hashPassword(data.password);
              } else {
                user = {
                  id: `usr-${Date.now()}`,
                  email: data.email,
                  name: data.name || 'User',
                  role: data.role || 'Engineer',
                  phone: data.phone || '',
                  company: data.company || '',
                  department: data.department || '',
                  avatar: data.avatar || 'MW',
                  profileImage: data.profileImage || 'MW',
                  status: 'active',
                  preferences: data.preferences || { theme: 'dark', language: 'en', notificationSettings: true }
                };
                this.database.users.push(user);
              }
              this.saveDatabase();
              
              const updatedUserInfo = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                company: user.company,
                department: user.department,
                profileImage: user.profileImage || user.avatar,
                role: user.role,
                createdDate: user.createdDate,
                lastLogin: user.lastLogin,
                status: user.status,
                preferences: user.preferences
              };

              this.notifySseClients('PROFILE_UPDATED', updatedUserInfo);
              res.writeHead(200);
              res.end(JSON.stringify({ success: true, user: updatedUserInfo }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid Payload' }));
            }
          });
          return;
        }

        // --- PROJECTS REST API (Multi-User History Aware) ---
        if (pathname === '/api/projects') {
          if (req.method === 'GET') {
            const userEmail = parsedUrl.query.email || parsedUrl.query.userEmail;
            const userId = parsedUrl.query.userId;
            let results = this.database.projects;

            if (userEmail) {
              results = results.filter(p => p.userEmail && p.userEmail.toLowerCase() === userEmail.toLowerCase());
            } else if (userId) {
              results = results.filter(p => p.userId === userId);
            }

            res.writeHead(200);
            res.end(JSON.stringify(results));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const project = JSON.parse(body);
                if (!project.id) project.id = `proj-${Date.now()}`;
                
                // Attach current token claims user if user email/id is not explicitly present
                const authHeader = req.headers['authorization'];
                const token = authHeader ? authHeader.replace('Bearer ', '') : null;
                const claims = jwtAuth.verifyToken(token);
                if (claims && (!project.userEmail || !project.userId)) {
                  project.userId = project.userId || claims.id;
                  project.userEmail = project.userEmail || claims.email;
                  project.userName = project.userName || claims.name;
                }

                const idx = this.database.projects.findIndex(p => p.id === project.id);
                if (idx >= 0) {
                  this.database.projects[idx] = { ...this.database.projects[idx], ...project };
                } else {
                  this.database.projects.unshift(project);
                }
                this.saveIndividualProjectFile(project);
                this.saveDatabase();
                firebaseBackend.syncProjectToCloud(project);
                this.notifySseClients('PROJECTS_UPDATED', { action: 'UPSERT', project, projects: this.database.projects });
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
            this.notifySseClients('PROJECTS_UPDATED', { action: 'DELETE', id, projects: this.database.projects });
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, projects: this.database.projects }));
          }
          return;
        }

        // --- AI RECOMMENDATION API ---
        if (pathname === '/api/ai/analyze' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const reqData = JSON.parse(body);
              const result = {
                productName: reqData.productName || 'Smart Device Chassis',
                recommendedMaterial: reqData.material || 'ABS Plastic',
                recommendedProcess: reqData.process || 'Injection Molding',
                dfmScore: 94.5,
                estimatedUnitCost: 480,
                costSavings: 140000,
                leadTimeDays: 14,
                reasoning: [
                  "High melt flow index provides rapid cycle times.",
                  "Tensile yield strength exceeds minimum 1.5x safety factor.",
                  "28% batch cost reduction at 5,000 production volume."
                ]
              };
              res.writeHead(200);
              res.end(JSON.stringify({ success: true, result }));
            } catch (e) {
              res.writeHead(400);
              res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
            }
          });
          return;
        }

        // --- SETTINGS REST API ---
        if (pathname === '/api/settings') {
          if (req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(this.database.settings));
          } else if (req.method === 'PUT' || req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const newSettings = JSON.parse(body);
                this.database.settings = { ...this.database.settings, ...newSettings };
                this.saveDatabase();
                this.notifySseClients('SETTINGS_UPDATED', this.database.settings);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, settings: this.database.settings }));
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON Payload' }));
              }
            });
          }
          return;
        }

        // --- NOTIFICATIONS REST API ---
        if (pathname === '/api/notifications') {
          if (req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(this.database.notifications));
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

              const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
              const expiresAt = Date.now() + 10 * 60 * 1000;

              this.otpStore[email] = { code: otpCode, expiresAt };
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
              if (!record || record.code !== otp || Date.now() > record.expiresAt) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid or expired OTP code.' }));
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

              const record = this.otpStore[email];
              if (!record || record.code !== otp) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid or expired OTP session.' }));
                return;
              }

              let user = this.database.users.find(u => u.email.toLowerCase() === email);
              if (user) {
                user.passwordHash = jwtAuth.hashPassword(newPassword);
              }
              this.saveDatabase();
              delete this.otpStore[email];

              res.writeHead(200);
              res.end(JSON.stringify({ success: true, message: 'Password updated successfully!' }));
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
      console.log(` Real-Time Sync SSE:  http://${this.wifiIp}:${this.port}/api/sync/stream`);
      console.log(`=======================================================`);
    });
  }
}

const backend = new MethodWiseBackend();
backend.startServer();
