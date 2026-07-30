/**
 * MethodWise AI - Dedicated Frontend Application Module
 * File: frontend.js
 * 
 * Manages the User Interface, View Routing, Dynamic 2D/3D Visualizer Rendering,
 * Form Wizards, and Real-Time Communication with backend.js REST API.
 */

class MethodWiseFrontendApp {
  constructor() {
    this.appName = 'MethodWise AI';
    this.version = '1.0.0';
    this.backendUrl = 'http://' + (window.location.hostname && window.location.hostname !== 'localhost' ? window.location.hostname : '192.168.1.8') + ':8080';
    this.activeView = 'dashboard-overview';
    this.activeProduct = {
      name: 'Smart Board',
      type: 'Consumer Electronics',
      material: 'ABS Plastic',
      process: 'Injection Molding'
    };
  }

  init() {
    console.log(`[Frontend] Initializing ${this.appName} Frontend Module v${this.version}...`);
    this.bindEvents();
    this.syncWithBackend();
  }

  bindEvents() {
    window.setActiveProductName = (name) => this.updateActiveProductName(name);
  }

  updateActiveProductName(name) {
    if (!name) return;
    this.activeProduct.name = name;
    console.log(`[Frontend] Active Product Name Updated: ${name}`);

    const targetIds = [
      'res-prod-name',
      'summary-card-name',
      'topbar-active-prod-name',
      'blueprint-page-title',
      'blueprint-page-subtitle',
      '3d-page-title',
      '3d-page-subtitle',
      'm-topbar-title',
      'm-active-prod-name'
    ];

    targetIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = name;
    });
  }

  async syncWithBackend() {
    try {
      const response = await fetch(`${this.backendUrl}/api/projects`);
      if (response.ok) {
        const projects = await response.json();
        console.log(`[Frontend] Synced ${projects.length} design projects from backend.js API.`);
        if (projects.length > 0 && projects[0].name) {
          this.updateActiveProductName(projects[0].name);
        }
      }
    } catch (e) {
      console.log('[Frontend] Backend API connecting via Local Storage bus fallback.');
    }
  }

  switchView(viewId) {
    this.activeView = viewId;
    console.log(`[Frontend] Navigated to view: ${viewId}`);

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.add('hidden');
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(viewId);
    if (activeSec) {
      activeSec.classList.remove('hidden');
      activeSec.classList.add('active');
    }

    if (window.lucide) window.lucide.createIcons();
    window.scrollTo(0, 0);
  }
}

// Global Frontend Module Instance
window.frontendApp = new MethodWiseFrontendApp();

document.addEventListener('DOMContentLoaded', () => {
  if (window.frontendApp) {
    window.frontendApp.init();
  }
});
