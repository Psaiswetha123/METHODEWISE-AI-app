/**
 * MethodWise AI - Shared Local Network Server & Synchronization API
 * Serves Web & Mobile App at http://192.168.1.7:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const otpEmailService = require('./email-service.js');

const PORT = 8080;
const HOST = '0.0.0.0'; // Accessible on 192.168.1.7 & local network
const DB_FOLDER = path.join(__dirname, 'database');

function ensureDbFolder() {
  if (!fs.existsSync(DB_FOLDER)) fs.mkdirSync(DB_FOLDER, { recursive: true });
  const projDir = path.join(DB_FOLDER, 'projects');
  if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });
}

function loadDb() {
  ensureDbFolder();
  let db = {
    session: { isLoggedIn: true, user: { name: 'Engineering Lead', email: 'engineer@methodwise.ai' } },
    projects: [],
    favorites: ["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"],
    settings: { theme: 'dark', pushNotifications: true }
  };
  try {
    const pFile = path.join(DB_FOLDER, 'projects.json');
    if (fs.existsSync(pFile)) db.projects = JSON.parse(fs.readFileSync(pFile, 'utf8'));
    const fFile = path.join(DB_FOLDER, 'favorites.json');
    if (fs.existsSync(fFile)) db.favorites = JSON.parse(fs.readFileSync(fFile, 'utf8'));
    const sFile = path.join(DB_FOLDER, 'settings.json');
    if (fs.existsSync(sFile)) db.settings = JSON.parse(fs.readFileSync(sFile, 'utf8'));
  } catch (e) {
    console.error('Failed loading DB folder in server.js:', e.message);
  }
  return db;
}

let db = loadDb();
const otpStore = {};

function saveDb() {
  try {
    ensureDbFolder();
    fs.writeFileSync(path.join(DB_FOLDER, 'projects.json'), JSON.stringify(db.projects, null, 2), 'utf8');
    fs.writeFileSync(path.join(DB_FOLDER, 'favorites.json'), JSON.stringify(db.favorites, null, 2), 'utf8');
    fs.writeFileSync(path.join(DB_FOLDER, 'settings.json'), JSON.stringify(db.settings, null, 2), 'utf8');
    fs.writeFileSync(path.join(DB_FOLDER, 'database.json'), JSON.stringify({ databaseName: "MethodWise AI Database", version: "1.0.0", lastUpdated: new Date().toISOString().split('T')[0], ...db }, null, 2), 'utf8');
  } catch (e) {}
}

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
            saveDb();
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
        saveDb();
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
            if (data.favorites) {
              db.favorites = data.favorites;
              saveDb();
            }
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

          otpStore[email] = { code: otpCode, expiresAt };

          console.log(`\n[SERVER AUTH SERVICE] OTP Generated for ${email}: ${otpCode}`);

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

          const record = otpStore[email];
          if (!record) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No OTP request found for this email.' }));
            return;
          }

          if (Date.now() > record.expiresAt) {
            delete otpStore[email];
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'OTP code has expired.' }));
            return;
          }

          if (record.code !== otp) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'Incorrect OTP code.' }));
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

          const record = otpStore[email];
          if (!record || record.code !== otp || Date.now() > record.expiresAt) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'Invalid or expired OTP session.' }));
            return;
          }

          if (!db.users) db.users = [];
          let user = db.users.find(u => u.email && u.email.toLowerCase() === email);
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
            db.users.push(user);
          }

          saveDb();
          delete otpStore[email];

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
