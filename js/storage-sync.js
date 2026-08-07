/**
 * MethodWise AI - Real-Time Unified Storage & Synchronization Engine
 * Enables bi-directional instant synchronization between Web Application and Native Android Application
 */

class StorageSyncEngine {
  constructor() {
    this.listeners = new Set();
    this.broadcastChannel = null;
    this.eventSource = null;
    this.init();
  }

  getServerUrl() {
    if (window.SERVER_HOST_URL) return window.SERVER_HOST_URL;
    if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.getServerHostUrl === 'function') {
      try {
        const bridgeUrl = window.AndroidNativeBridge.getServerHostUrl();
        if (bridgeUrl) return bridgeUrl;
      } catch (e) {}
    }
    if (window.location.protocol && window.location.protocol.startsWith('http') && window.location.origin && window.location.origin !== 'null') {
      return window.location.origin;
    }
    return 'http://localhost:8080';
  }

  init() {
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('methodwise_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {}
    }

    window.addEventListener('storage', (event) => {
      this.notifyListeners({
        type: 'STORAGE_CHANGED',
        key: event.key,
        newValue: event.newValue,
        oldValue: event.oldValue
      });
    });

    // Real-Time Server-Sent Events (SSE) Stream Listener
    this.connectSseStream();

    // Initial sync fetch from Network REST API & fallback polling loop
    this.fetchProjectsFromNetwork();
    setInterval(() => this.fetchProjectsFromNetwork(), 3000);
  }

  connectSseStream() {
    if (!('EventSource' in window)) return;
    try {
      if (this.eventSource) this.eventSource.close();
      const sseUrl = this.getServerUrl() + '/api/sync/stream';
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.addEventListener('PROJECTS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.projects) {
            localStorage.setItem('methodwise_projects', JSON.stringify(data.projects));
            this.emit('PROJECTS_UPDATED', { projects: data.projects });
          } else {
            this.fetchProjectsFromNetwork();
          }
        } catch (err) {
          this.fetchProjectsFromNetwork();
        }
      });

      this.eventSource.addEventListener('PROFILE_UPDATED', (e) => {
        try {
          const user = JSON.parse(e.data);
          const current = this.getAuthSession();
          this.saveAuthSession(true, { ...current.user, ...user });
        } catch (err) {}
      });

      this.eventSource.addEventListener('SETTINGS_UPDATED', (e) => {
        try {
          const settings = JSON.parse(e.data);
          localStorage.setItem('methodwise_settings', JSON.stringify(settings));
          this.emit('SETTINGS_UPDATED', { settings });
        } catch (err) {}
      });
    } catch (e) {}
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) {}
    });
  }

  emit(type, payload = {}) {
    const data = { type, payload, timestamp: Date.now() };
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(data); } catch (e) {}
    }
    this.notifyListeners(data);
  }

  async fetchProjectsFromNetwork() {
    try {
      const apiUrl = this.getServerUrl() + '/api/projects';
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const projects = await res.json();
        if (Array.isArray(projects)) {
          localStorage.setItem('methodwise_projects', JSON.stringify(projects));
          this.emit('PROJECTS_UPDATED', { projects });
        }
      }
    } catch (e) {}
  }

  // --- Auth Session Sync & UserInfo Management ---
  getAuthSession() {
    let sessionStr = localStorage.getItem('methodwise_auth_session') || sessionStorage.getItem('methodwise_auth_session');
    if (!sessionStr) {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const userStr = localStorage.getItem('CurrentUser') || localStorage.getItem('User');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          return { isLoggedIn: true, user: this.formatUserInfo(user, token), token: token, refreshToken: localStorage.getItem('refreshToken') };
        } catch (e) {}
      }
      return { isLoggedIn: false, user: null, token: null, refreshToken: null };
    }
    try {
      const session = JSON.parse(sessionStr);
      if (session && session.isLoggedIn && session.user) {
        session.user = this.formatUserInfo(session.user, session.token, session.refreshToken);
      }
      return session;
    } catch (e) {
      return { isLoggedIn: false, user: null, token: null, refreshToken: null };
    }
  }

  formatUserInfo(rawUser = {}, token = null, refreshToken = null) {
    if (!rawUser) return null;
    const initialAvatar = rawUser.profileImage || rawUser.avatar || (rawUser.name ? rawUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'MW');
    return {
      id: rawUser.id || `usr-${Date.now()}`,
      name: rawUser.name || 'Sai Swetha',
      email: rawUser.email || 'saiswethanaidu.56@gmail.com',
      phone: rawUser.phone || '+91 98765 43210',
      company: rawUser.company || 'MethodWise Technologies',
      department: rawUser.department || 'DFM Engineering & R&D',
      profileImage: initialAvatar,
      role: rawUser.role || 'Lead DFM Engineer (Owner)',
      token: token || rawUser.token || localStorage.getItem('authToken'),
      refreshToken: refreshToken || rawUser.refreshToken || localStorage.getItem('refreshToken'),
      createdDate: rawUser.createdDate || '2026-01-01',
      lastLogin: rawUser.lastLogin || new Date().toISOString(),
      status: rawUser.status || 'active',
      preferences: rawUser.preferences || { theme: 'dark', language: 'en', notificationSettings: true }
    };
  }

  saveAuthSession(isLoggedIn, user = null, token = null, refreshToken = null, remember = true) {
    const userInfo = this.formatUserInfo(user, token, refreshToken);
    const session = {
      isLoggedIn: isLoggedIn,
      user: userInfo,
      token: token || (userInfo ? userInfo.token : null),
      refreshToken: refreshToken || (userInfo ? userInfo.refreshToken : null),
      timestamp: Date.now()
    };

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('methodwise_auth_session', JSON.stringify(session));

    if (isLoggedIn && userInfo) {
      localStorage.setItem('CurrentUser', JSON.stringify(userInfo));
      localStorage.setItem('User', JSON.stringify(userInfo));
      if (session.token) {
        localStorage.setItem('authToken', session.token);
        localStorage.setItem('token', session.token);
      }
      if (session.refreshToken) {
        localStorage.setItem('refreshToken', session.refreshToken);
      }
    }

    this.emit('AUTH_STATE_CHANGED', session);

    // Sync profile change to backend server if logged in
    if (isLoggedIn && userInfo && userInfo.email) {
      const apiUrl = this.getServerUrl() + '/api/auth/profile';
      fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInfo),
        signal: AbortSignal.timeout(2000)
      }).catch(() => {});
    }
  }

  clearAuthSession() {
    localStorage.removeItem('methodwise_auth_session');
    sessionStorage.removeItem('methodwise_auth_session');
    localStorage.removeItem('CurrentUser');
    localStorage.removeItem('User');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.emit('AUTH_STATE_CHANGED', { isLoggedIn: false, user: null, token: null, refreshToken: null });
  }

  // --- Projects Data Sync (Multi-User History Aware) ---
  getProjects(currentUserOnly = false) {
    const local = localStorage.getItem('methodwise_projects');
    let projects = [];
    if (local) {
      try { projects = JSON.parse(local); } catch (e) { projects = []; }
    }
    if (currentUserOnly) {
      const session = this.getAuthSession();
      if (session && session.user && session.user.email) {
        return projects.filter(p => !p.userEmail || p.userEmail.toLowerCase() === session.user.email.toLowerCase());
      }
    }
    return projects;
  }

  async saveProject(project) {
    const session = this.getAuthSession();
    if (session && session.user) {
      project.userId = project.userId || session.user.id;
      project.userEmail = project.userEmail || session.user.email;
      project.userName = project.userName || session.user.name;
    }

    let projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) projects[idx] = project;
    else projects.unshift(project);

    localStorage.setItem('methodwise_projects', JSON.stringify(projects));
    this.emit('PROJECTS_UPDATED', { projects });

    // Sync to Firebase Cloud Firestore
    if (window.syncProjectToFirebase) {
      try { window.syncProjectToFirebase(project); } catch (fbErr) {}
    }

    try {
      const apiUrl = this.getServerUrl() + '/api/projects';
      const headers = { 'Content-Type': 'application/json' };
      if (session && session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(project),
        signal: AbortSignal.timeout(2500)
      });
    } catch (e) {}
  }

  async deleteProject(id) {
    let projects = this.getProjects().filter(p => p.id !== id);
    localStorage.setItem('methodwise_projects', JSON.stringify(projects));
    this.emit('PROJECTS_UPDATED', { projects });

    try {
      const apiUrl = this.getServerUrl() + `/api/projects?id=${id}`;
      await fetch(apiUrl, { method: 'DELETE', signal: AbortSignal.timeout(2500) });
    } catch (e) {}
  }

  // --- Settings Sync ---
  getSettings() {
    const local = localStorage.getItem('methodwise_settings');
    if (!local) return { theme: 'dark', notifications: true, autoSave: true };
    try { return JSON.parse(local); } catch (e) { return { theme: 'dark', notifications: true, autoSave: true }; }
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem('methodwise_settings', JSON.stringify(updated));
    this.emit('SETTINGS_UPDATED', { settings: updated });

    try {
      const apiUrl = this.getServerUrl() + '/api/settings';
      fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
        signal: AbortSignal.timeout(2000)
      }).catch(() => {});
    } catch (e) {}
  }

  // --- Favorites Sync ---
  getFavorites() {
    const local = localStorage.getItem('methodwise_favorites');
    if (!local) return [];
    try { return JSON.parse(local); } catch (e) { return []; }
  }

  saveFavorite(item) {
    let favs = this.getFavorites();
    if (!favs.some(f => f.id === item.id)) {
      favs.push(item);
      localStorage.setItem('methodwise_favorites', JSON.stringify(favs));
    }
  }
}

window.MethodWiseSync = new StorageSyncEngine();
