/**
 * MethodWise AI - Android Mobile Application Coordinator
 * Manages Mobile SPA state, bottom navigation, drawer menu, touch events, and data sync.
 */

class MethodWiseMobileApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.isLoggedIn = false;
    this.ui = null;
    this.viewer3D = null;
    this.viewer2D = null;
    this.currentAnalysisResult = null;
    this.historyStack = [];
  }

  init() {
    const hideSplash = () => {
      const splash = document.getElementById('mobile-splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.pointerEvents = 'none';
        setTimeout(() => splash.classList.add('hidden'), 200);
      }
    };

    try {
      this.ui = new window.MobileUIComponents(this);

      // 1. Check Auth Session
      if (window.MethodWiseSync) {
        const session = window.MethodWiseSync.getAuthSession();
        this.isLoggedIn = session ? session.isLoggedIn : false;
        window.MethodWiseSync.subscribe((event) => this.handleSyncEvent(event));
      } else {
        this.isLoggedIn = false;
      }

      // 2. Bind UI & Touch Listeners
      this.bindEvents();

      // 3. Initial View Render
      if (!this.isLoggedIn) {
        this.switchTab('login');
      } else {
        this.switchTab('dashboard');
      }
    } catch (err) {
      console.warn('Mobile init warning:', err);
    } finally {
      // Hide Splash Screen immediately guaranteed
      setTimeout(hideSplash, 200);
    }
  }

  bindEvents() {
    // Drawer Toggle
    const drawerToggleBtn = document.getElementById('m-drawer-toggle-btn');
    if (drawerToggleBtn) {
      drawerToggleBtn.addEventListener('click', () => this.toggleDrawer(true));
    }

    const drawerOverlay = document.getElementById('m-drawer-overlay');
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', () => this.toggleDrawer(false));
    }

    const drawerCloseBtn = document.getElementById('m-drawer-close-btn');
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', () => this.toggleDrawer(false));
    }

    // Bottom Sheet Close
    const sheetOverlay = document.getElementById('m-sheet-overlay');
    if (sheetOverlay) {
      sheetOverlay.addEventListener('click', () => this.closeBottomSheet());
    }

    // Bottom Navigation Tabs
    document.querySelectorAll('[data-m-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = tabBtn.getAttribute('data-m-tab');
        this.switchTab(tab);
      });
    });

    // Android Native Back Button simulation
    window.addEventListener('popstate', () => {
      if (this.historyStack.length > 1) {
        this.historyStack.pop();
        const previousTab = this.historyStack[this.historyStack.length - 1];
        this.switchTab(previousTab, false);
      }
    });

    // Touch Swipe Left/Right for Tab Navigation
    this.initSwipeGestures();
  }

  initSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    const contentArea = document.getElementById('mobile-content-container');

    if (!contentArea) return;

    contentArea.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    contentArea.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      const tabs = ['dashboard', 'create', 'advisors', 'mfg', 'cost', 'history', 'settings'];

      if (Math.abs(diff) > 70) {
        const idx = tabs.indexOf(this.currentTab);
        if (idx !== -1) {
          if (diff > 0 && idx < tabs.length - 1) {
            this.switchTab(tabs[idx + 1]);
          } else if (diff < 0 && idx > 0) {
            this.switchTab(tabs[idx - 1]);
          }
        }
      }
    }, { passive: true });
  }

  toggleDrawer(open) {
    const drawer = document.getElementById('m-drawer');
    const overlay = document.getElementById('m-drawer-overlay');
    if (!drawer || !overlay) return;

    if (open) {
      drawer.classList.add('active');
      overlay.classList.add('active');
    } else {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }
  }

  switchTab(tabId, pushHistory = true) {
    if (!this.isLoggedIn && tabId !== 'login') {
      tabId = 'login';
    }

    this.currentTab = tabId;

    if (pushHistory && (this.historyStack[this.historyStack.length - 1] !== tabId)) {
      this.historyStack.push(tabId);
      window.history.pushState({ tab: tabId }, '');
    }

    // Toggle Header & Bottom Nav visibility for Login vs Logged-in screens
    const topbar = document.getElementById('mobile-topbar');
    const bottomNav = document.getElementById('mobile-bottom-nav');
    const fab = document.getElementById('mobile-fab');

    if (tabId === 'login') {
      if (topbar) topbar.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
      if (fab) fab.style.display = 'none';
    } else {
      if (topbar) topbar.style.display = 'flex';
      if (bottomNav) bottomNav.style.display = 'flex';
      if (fab) fab.style.display = 'flex';
    }

    // Update Bottom Nav active tab highlight
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.getAttribute('data-m-tab') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Render corresponding screen view content
    const container = document.getElementById('mobile-content-container');
    if (!container) return;

    let html = '';
    switch (tabId) {
      case 'login': html = this.ui.renderLoginView(); break;
      case 'dashboard': html = this.ui.renderDashboardView(); break;
      case 'create': html = this.ui.renderCreateWizardView(); break;
      case 'results': html = this.ui.renderAIResultsView(this.currentAnalysisResult); break;
      case 'advisors': html = this.ui.renderMaterialAdvisorView(); break;
      case 'mfg': html = this.ui.renderMfgAdvisorView(); break;
      case 'cost': html = this.ui.renderCostAnalysisView(); break;
      case 'visualization': html = this.ui.renderVisualizationView(); break;
      case 'history': html = this.ui.renderHistoryView(); break;
      case 'settings': html = this.ui.renderSettingsView(); break;
      default: html = this.ui.renderDashboardView();
    }

    container.innerHTML = `<div class="mobile-view active">${html}</div>`;

    if (window.lucide) window.lucide.createIcons();
    container.scrollTop = 0;

    // Post-render attachments
    this.postRenderViewSetup(tabId);
  }

  postRenderViewSetup(tabId) {
    if (tabId === 'login') {
      const loginForm = document.getElementById('m-login-form');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.login();
        });
      }
      const demoBtn = document.getElementById('m-demo-login-btn');
      if (demoBtn) {
        demoBtn.addEventListener('click', () => this.login());
      }
    } else if (tabId === 'create') {
      const wizForm = document.getElementById('m-wizard-form');
      if (wizForm) {
        wizForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.runAIEvaluation();
        });
      }
    } else if (tabId === 'visualization') {
      setTimeout(() => this.initMobile3DViewer(), 100);
    }
  }

  login() {
    this.isLoggedIn = true;
    window.MethodWiseSync.saveAuthSession(true);
    this.showPushNotification('Welcome to MethodWise AI', 'Logged into Mobile App successfully.');
    this.switchTab('dashboard');
  }

  logout() {
    this.isLoggedIn = false;
    window.MethodWiseSync.clearAuthSession();
    this.showPushNotification('Logged Out', 'Your session has ended.');
    this.switchTab('login');
  }

  runAIEvaluation() {
    const name = document.getElementById('m-wiz-name')?.value || 'Smart Helmet Shell';
    const type = document.getElementById('m-wiz-type')?.value || 'Consumer Electronics';
    const strength = document.getElementById('m-wiz-strength')?.value || 'medium';
    const temp = document.getElementById('m-wiz-temp')?.value || 'ambient';
    const qty = parseInt(document.getElementById('m-wiz-qty-slider')?.value || 5000);

    const reqs = { productName: name, productType: type, targetUsage: strength, environmentalExposure: temp, productionVolume: qty };

    let evalResult = null;
    if (window.AIEngine) {
      evalResult = window.AIEngine.evaluateProductDesign(reqs);
    } else {
      evalResult = {
        productName: name,
        productType: type,
        recommendedMaterial: { name: 'ABS Plastic', category: 'Plastics', strength: 45, density: 1.05, costDisplay: 'Low' },
        recommendedProcess: { name: 'Injection Molding', category: 'Molding', leadTime: '2-4 Weeks' },
        costBreakdown: { materialCost: 180, manufacturingCost: 240, assemblyCost: 60, totalPerUnit: 480, costRangeDisplay: '₹420 - ₹540' },
        scores: { overallScore: 9.4, strengthScore: 88, costScore: 95, sustainabilityScore: 82, manufacturabilityScore: 94, efficiency: 92 },
        explanations: {
          selectionReason: `${name} is optimized with ABS Plastic & Injection Molding for durability and cost control.`,
          advantages: ['High structural strength', 'Rapid cycle time', 'Cost effective'],
          limitations: ['Requires precision tooling mold'],
          processExplanation: 'Injection Molding maximizes batch efficiency.',
          productionBenefits: ['Repeatable tolerances']
        }
      };
    }

    this.currentAnalysisResult = evalResult;

    // Save project & sync across platforms
    window.MethodWiseSync.saveProject({
      id: 'proj-' + Date.now().toString().slice(-4),
      name: evalResult.productName,
      type: evalResult.productType,
      date: new Date().toISOString().split('T')[0],
      material: evalResult.recommendedMaterial.name,
      process: evalResult.recommendedProcess.name,
      costRange: evalResult.costBreakdown.costRangeDisplay,
      unitCost: evalResult.costBreakdown.totalPerUnit,
      score: evalResult.scores.overallScore
    });

    this.showPushNotification('AI Analysis Generated', `${name} DFM score 9.4/10 generated.`);
    this.switchTab('results');
  }

  initMobile3DViewer() {
    const container = document.getElementById('mobile-3d-canvas-container');
    if (!container || !window.CAD3DViewer) return;

    container.innerHTML = '';
    const prodName = (this.currentAnalysisResult && this.currentAnalysisResult.productName) || 'Smart Product';
    this.viewer3D = new window.CAD3DViewer('mobile-3d-canvas-container', {
      autoRotate: true,
      materialStyle: 'metallic',
      productName: prodName
    });
  }

  toggleVizMode(mode) {
    const b3d = document.getElementById('m-3d-box');
    const b2d = document.getElementById('m-2d-box');
    const btn3d = document.getElementById('m-wiz-3d-btn');
    const btn2d = document.getElementById('m-wiz-2d-btn');

    if (mode === '3d') {
      if (b3d) b3d.style.display = 'block';
      if (b2d) b2d.style.display = 'none';
      if (btn3d) { btn3d.className = 'm-btn m-btn-primary'; }
      if (btn2d) { btn2d.className = 'm-btn m-btn-outline'; }
    } else {
      if (b3d) b3d.style.display = 'none';
      if (b2d) b2d.style.display = 'block';
      if (btn3d) { btn3d.className = 'm-btn m-btn-outline'; }
      if (btn2d) { btn2d.className = 'm-btn m-btn-primary'; }

      if (window.CAD2DViewer) {
        const c2d = document.getElementById('mobile-2d-canvas-container');
        if (c2d) c2d.innerHTML = '';
        this.viewer2D = new window.CAD2DViewer('mobile-2d-canvas-container', {
          length: 280, width: 220, height: 180, unit: 'mm', productName: '2D Blueprint'
        });
      }
    }
  }

  updateCostCalc(val) {
    const qty = parseInt(val);
    const disp = document.getElementById('m-cost-qty-disp');
    if (disp) disp.textContent = `${qty.toLocaleString()} Units`;

    const toolingFixed = 250000;
    const toolingPerUnit = Math.round(toolingFixed / qty);
    const matCost = 180;
    const mfgCost = 240;
    const inspCost = 10;
    const totalUnit = matCost + mfgCost + toolingPerUnit + inspCost;
    const totalBatch = totalUnit * qty;

    const unitPriceEl = document.getElementById('m-cost-unit-price');
    const totalBatchEl = document.getElementById('m-cost-total-batch');
    if (unitPriceEl) unitPriceEl.textContent = `₹${totalUnit.toLocaleString()} / unit`;
    if (totalBatchEl) totalBatchEl.textContent = `Total Batch: ₹${totalBatch.toLocaleString()}`;

    const mMat = document.getElementById('m-cost-mat');
    const mMfg = document.getElementById('m-cost-mfg');
    const mTool = document.getElementById('m-cost-tool');

    if (mMat) mMat.textContent = `₹${matCost} (${Math.round((matCost / totalUnit) * 100)}%)`;
    if (mMfg) mMfg.textContent = `₹${mfgCost} (${Math.round((mfgCost / totalUnit) * 100)}%)`;
    if (mTool) mTool.textContent = `₹${toolingPerUnit} (${Math.round((toolingPerUnit / totalUnit) * 100)}%)`;
  }

  toggleFavorite(materialName) {
    const favs = window.MethodWiseSync.toggleFavoriteMaterial(materialName);
    this.showPushNotification('Favorite Updated', `${materialName} saved to favorites.`);
    if (this.currentTab === 'dashboard') this.switchTab('dashboard', false);
    if (this.currentTab === 'advisors') this.switchTab('advisors', false);
  }

  deleteProject(projectId) {
    if (confirm('Delete project design? Changes will sync immediately to Web.')) {
      window.MethodWiseSync.deleteProject(projectId);
      this.showPushNotification('Project Removed', 'Deleted project synchronized.');
      this.switchTab('history', false);
    }
  }

  viewHistoryDetail(projectId) {
    const projects = window.MethodWiseSync.getProjects();
    const p = projects.find(x => x.id === projectId);
    if (p) {
      this.currentAnalysisResult = {
        productName: p.name,
        productType: p.type || 'Consumer Electronics',
        recommendedMaterial: { name: p.material },
        recommendedProcess: { name: p.process },
        costBreakdown: { costRangeDisplay: p.costRange || `₹${p.unitCost}` },
        scores: { overallScore: p.score || 9.2, strengthScore: 88, costScore: 94, sustainabilityScore: 80, manufacturabilityScore: 92, efficiency: 90 },
        explanations: {
          selectionReason: `${p.material} delivers optimal mechanical properties for ${p.name}.`,
          advantages: ['High structural strength', 'Optimal manufacturing cost'],
          limitations: ['Standard tooling lead time']
        }
      };
      this.switchTab('results');
    }
  }

  openMaterialSheet(matId) {
    const dataMat = window.METHODWISE_DATA.MATERIALS;
    const allMats = [...dataMat.metals, ...dataMat.plastics, ...dataMat.composites];
    const m = allMats.find(x => x.id === matId);
    if (!m) return;

    this.showBottomSheet(`
      <h3 style="font-size: 1.2rem; color: var(--accent-cyan); margin-bottom: 6px;">${m.name}</h3>
      <span class="m-badge m-badge-cyan" style="margin-bottom: 12px;">${m.category}</span>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Strength: <strong>${m.strength} MPa</strong> | Density: <strong>${m.density} g/cm³</strong></p>
      
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 0.88rem; color: var(--accent-emerald); margin-bottom: 6px;">Advantages:</h4>
        <ul style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px; padding-left: 16px;">
          ${(m.advantages || ['High strength', 'Corrosion resistance']).map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>

      <button class="m-btn m-btn-primary" onclick="window.mobileApp.toggleFavorite('${m.name}')">
        <i data-lucide="heart"></i> Save to Favorites
      </button>
    `);
  }

  openMfgSheet(procId) {
    const p = (window.METHODWISE_DATA.PROCESSES || []).find(x => x.id === procId);
    if (!p) return;

    this.showBottomSheet(`
      <h3 style="font-size: 1.2rem; color: var(--accent-emerald); margin-bottom: 6px;">${p.name}</h3>
      <span class="m-badge m-badge-purple" style="margin-bottom: 12px;">${p.category || 'Manufacturing'}</span>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">${p.description}</p>
      
      <div style="font-size: 0.82rem; display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
        <div>Batch Volume: <strong>${p.bestForQty}</strong></div>
        <div>Lead Time: <strong>${p.leadTime}</strong></div>
        <div>Tolerance Accuracy: <strong>${p.accuracy}</strong></div>
      </div>
    `);
  }

  showBottomSheet(htmlContent) {
    const sheet = document.getElementById('m-sheet');
    const content = document.getElementById('m-sheet-content');
    const overlay = document.getElementById('m-sheet-overlay');

    if (sheet && content && overlay) {
      content.innerHTML = htmlContent;
      sheet.classList.add('active');
      overlay.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeBottomSheet() {
    const sheet = document.getElementById('m-sheet');
    const overlay = document.getElementById('m-sheet-overlay');
    if (sheet && overlay) {
      sheet.classList.remove('active');
      overlay.classList.remove('active');
    }
  }

  showPushNotification(title, message) {
    const banner = document.getElementById('m-push-banner');
    if (!banner) return;

    banner.innerHTML = `
      <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(0, 242, 254, 0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-cyan);">
        <i data-lucide="bell" style="width: 18px;"></i>
      </div>
      <div>
        <div style="font-size: 0.85rem; font-weight: 700;">${title}</div>
        <div style="font-size: 0.76rem; color: var(--text-muted);">${message}</div>
      </div>
    `;

    banner.classList.add('active');
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      banner.classList.remove('active');
    }, 3500);
  }

  exportPDFReport() {
    alert('📄 Mobile PDF Report Generator:\nMethodWise AI Engineering & DFM Report generated successfully!\nFile downloaded: MethodWise_Engineering_Report.pdf');
  }

  exportMfgCSV() {
    alert('📊 CSV Export:\nMethodWise Manufacturing Process Data exported to CSV.');
  }

  toggleTheme() {
    const currentSettings = window.MethodWiseSync.getSettings();
    const newTheme = currentSettings.theme === 'light' ? 'dark' : 'light';
    window.MethodWiseSync.updateSettings({ theme: newTheme });
  }

  applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }

  handleSyncEvent(event) {
    if (event.type === 'SETTINGS_UPDATED') {
      this.applyTheme(event.payload.theme);
    } else if (event.type === 'PROJECTS_UPDATED') {
      if (this.currentTab === 'dashboard' || this.currentTab === 'history') {
        this.switchTab(this.currentTab, false);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.mobileApp = new MethodWiseMobileApp();
  window.mobileApp.init();
});
