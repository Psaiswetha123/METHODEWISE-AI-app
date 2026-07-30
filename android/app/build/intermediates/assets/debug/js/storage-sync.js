/**
 * MethodWise AI - Storage & Account Synchronization Engine
 * Enables bi-directional real-time data & account sync between Web & Android Mobile App over Local Wi-Fi (192.168.1.7).
 */

class StorageSyncEngine {
  constructor() {
    this.listeners = new Set();
    this.broadcastChannel = null;
    this.serverUrl = 'http://' + (window.location.hostname && window.location.hostname !== 'localhost' ? window.location.hostname : '192.168.1.8') + ':8080';
    this.init();
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

    // Initial sync fetch from Network API server & automatic 2-second polling loop
    this.fetchProjectsFromNetwork();
    setInterval(() => this.fetchProjectsFromNetwork(), 2000);
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
      const res = await fetch(`${this.serverUrl}/api/projects`);
      if (res.ok) {
        const projects = await res.json();
        localStorage.setItem('methodwise_projects', JSON.stringify(projects));
        this.emit('PROJECTS_UPDATED', { projects });
      }
    } catch (e) {
      // Offline / local fallback
    }
  }

  // --- Auth Session Sync ---
  getAuthSession() {
    const session = localStorage.getItem('methodwise_auth_session');
    if (!session) return { isLoggedIn: true, user: { name: 'Engineering Lead', email: 'engineer@methodwise.ai' } };
    try { return JSON.parse(session); } catch (e) { return { isLoggedIn: true, user: { name: 'Engineering Lead', email: 'engineer@methodwise.ai' } }; }
  }

  saveAuthSession(isLoggedIn, user = null) {
    const session = { isLoggedIn, user: user || { name: 'Engineering Lead', email: 'engineer@methodwise.ai' } };
    localStorage.setItem('methodwise_auth_session', JSON.stringify(session));
    this.emit('AUTH_STATE_CHANGED', session);
  }

  clearAuthSession() {
    localStorage.removeItem('methodwise_auth_session');
    this.emit('AUTH_STATE_CHANGED', { isLoggedIn: false, user: null });
  }

  // --- Projects Data Sync ---
  getProjects() {
    const stored = localStorage.getItem('methodwise_projects');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    const defaults = (window.METHODWISE_DATA && window.METHODWISE_DATA.PROJECTS) || [];
    localStorage.setItem('methodwise_projects', JSON.stringify(defaults));
    return defaults;
  }

  async saveProject(project) {
    const projects = this.getProjects();
    const existingIdx = projects.findIndex(p => p.id === project.id);
    if (existingIdx >= 0) {
      projects[existingIdx] = { ...projects[existingIdx], ...project };
    } else {
      projects.unshift(project);
    }
    localStorage.setItem('methodwise_projects', JSON.stringify(projects));
    this.emit('PROJECTS_UPDATED', { action: 'SAVE', project, projects });

    // Push update to Network Server at 192.168.1.7:8080
    try {
      await fetch(`${this.serverUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
    } catch (e) {}

    return projects;
  }

  async deleteProject(projectId) {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('methodwise_projects', JSON.stringify(projects));
    this.emit('PROJECTS_UPDATED', { action: 'DELETE', projectId, projects });

    // Sync delete with Network Server at 192.168.1.7:8080
    try {
      await fetch(`${this.serverUrl}/api/projects?id=${projectId}`, { method: 'DELETE' });
    } catch (e) {}

    return projects;
  }

  // --- Favorites Sync ---
  getFavorites() {
    const favs = localStorage.getItem('methodwise_fav_materials');
    if (!favs) return ["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"];
    try { return JSON.parse(favs); } catch (e) { return ["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"]; }
  }

  toggleFavoriteMaterial(materialName) {
    let favs = this.getFavorites();
    if (favs.includes(materialName)) {
      favs = favs.filter(f => f !== materialName);
    } else {
      favs.push(materialName);
    }
    localStorage.setItem('methodwise_fav_materials', JSON.stringify(favs));
    this.emit('FAVORITES_UPDATED', { favs });
    return favs;
  }

  // --- Settings & Theme Sync ---
  getSettings() {
    const s = localStorage.getItem('methodwise_settings');
    if (!s) return { theme: 'dark', pushNotifications: true };
    try { return JSON.parse(s); } catch (e) { return { theme: 'dark', pushNotifications: true }; }
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem('methodwise_settings', JSON.stringify(updated));
    this.emit('SETTINGS_UPDATED', updated);
    return updated;
  }
}

window.MethodWiseSync = new StorageSyncEngine();
