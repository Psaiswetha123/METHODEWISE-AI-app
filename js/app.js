/**
 * MethodWise AI - Main Application Coordinator
 * Handles SPA navigation, screen transitions, state management, and user interactions.
 */

class MethodWiseApp {
  constructor() {
    this.currentView = 'login-screen'; // Default first screen as requested by user
    this.isLoggedIn = false;
    this.currentAnalysisResult = null;
    this.viewer3DPageInstance = null;
    this.savedProjects = [];
  }

  init() {
    // 1. Initialize data & storage
    this.loadSavedProjects();

    // 2. Instantiate Wizard
    window.wizard = new window.WizardController();
    window.wizard.init();

    // 3. Initialize background CAD grid particles canvas for login screen
    this.initAuthCanvas();

    // 4. Bind global navigation and action listeners
    this.bindEvents();

    // 5. Initialize icons
    if (window.lucide) window.lucide.createIcons();

    // 6. Ensure correct initial screen visibility
    this.switchView('login-screen');
  }

  bindEvents() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    const demoLoginBtn = document.getElementById('demo-login-btn');
    if (demoLoginBtn) {
      demoLoginBtn.addEventListener('click', () => {
        document.getElementById('login-email').value = 'engineer@methodwise.ai';
        document.getElementById('login-password').value = 'demo12345';
        this.handleLogin();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Sidebar & Header Navigation buttons
    document.querySelectorAll('[data-target-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = btn.getAttribute('data-target-view');
        this.switchView(viewId);
      });
    });

    // Sidebar collapse toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        document.querySelector('.app-shell').classList.toggle('sidebar-collapsed');
      });
    }

    // 3D Preview Page Controls
    const btnWireframe = document.getElementById('btn-3d-wireframe');
    if (btnWireframe) {
      btnWireframe.addEventListener('click', () => {
        if (this.viewer3DPageInstance) {
          this.viewer3DPageInstance.toggleWireframe();
          this.showToast('Toggled Wireframe View', 'info');
        }
      });
    }

    const btnAutoOrbit = document.getElementById('btn-3d-orbit');
    if (btnAutoOrbit) {
      btnAutoOrbit.addEventListener('click', () => {
        if (this.viewer3DPageInstance) {
          let state = this.viewer3DPageInstance.toggleAutoOrbit();
          this.showToast(state ? 'Auto-Orbit Enabled' : 'Auto-Orbit Paused', 'info');
        }
      });
    }

    const btnExplode = document.getElementById('btn-3d-explode');
    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        if (this.viewer3DPageInstance) {
          let exploded = this.viewer3DPageInstance.toggleExplode();
          this.showToast(exploded ? 'Exploded Assembly View' : 'Collapsed View', 'info');
        }
      });
    }

    const btnResetView = document.getElementById('btn-3d-reset');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        if (this.viewer3DPageInstance) this.viewer3DPageInstance.resetView();
      });
    }

    // Material Shading dropdown
    const styleSelect = document.getElementById('select-3d-shading');
    if (styleSelect) {
      styleSelect.addEventListener('change', (e) => {
        if (this.viewer3DPageInstance) {
          this.viewer3DPageInstance.setMaterialStyle(e.target.value);
        }
      });
    }

    // Action Buttons in 3D Visualization page
    const btnGenCad = document.getElementById('btn-gen-cad');
    if (btnGenCad) {
      btnGenCad.addEventListener('click', () => this.openCadModal());
    }

    const btnGenProto = document.getElementById('btn-gen-proto');
    if (btnGenProto) {
      btnGenProto.addEventListener('click', () => this.openProtoModal());
    }

    const btnDownloadReport = document.getElementById('btn-download-report');
    if (btnDownloadReport) {
      btnDownloadReport.addEventListener('click', () => this.downloadReport());
    }

    // Global Search Engine Initialization
    this.bindGlobalSearch();
  }

  bindGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const dropdown = document.getElementById('global-search-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        dropdown.classList.add('hidden');
        return;
      }

      // Search Saved / History Projects
      const matchedProjects = (this.savedProjects || []).filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.type.toLowerCase().includes(q) || 
        p.material.toLowerCase().includes(q) || 
        p.process.toLowerCase().includes(q)
      );

      // Search Manufacturing Processes
      const matchedProcesses = (window.METHODWISE_DATA.PROCESSES || []).filter(pr => 
        pr.name.toLowerCase().includes(q) || 
        pr.category.toLowerCase().includes(q) || 
        pr.description.toLowerCase().includes(q)
      );

      // Search Materials
      const dataMat = window.METHODWISE_DATA.MATERIALS;
      const allMats = [...dataMat.metals, ...dataMat.plastics, ...dataMat.composites];
      const matchedMaterials = allMats.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.category.toLowerCase().includes(q)
      );

      let html = '';

      if (matchedProjects.length > 0) {
        html += `<div class="search-group-header">📌 Previous Design Projects</div>`;
        matchedProjects.slice(0, 4).forEach(p => {
          html += `
            <div class="search-result-item" onclick="window.app.selectSearchResult('project', '${p.id}')">
              <div>
                <div class="search-result-title">${p.name}</div>
                <div class="search-result-sub">${p.process} | ${p.material}</div>
              </div>
              <span class="badge badge-cyan">${p.date}</span>
            </div>
          `;
        });
      }

      if (matchedProcesses.length > 0) {
        html += `<div class="search-group-header">⚙️ Manufacturing Processes</div>`;
        matchedProcesses.slice(0, 3).forEach(pr => {
          html += `
            <div class="search-result-item" onclick="window.app.selectSearchResult('process', '${pr.id}')">
              <div>
                <div class="search-result-title">${pr.name}</div>
                <div class="search-result-sub">${pr.accuracy} | ${pr.bestForQty}</div>
              </div>
              <span class="badge badge-emerald">${pr.category || 'Process'}</span>
            </div>
          `;
        });
      }

      if (matchedMaterials.length > 0) {
        html += `<div class="search-group-header">🧪 Engineering Materials</div>`;
        matchedMaterials.slice(0, 3).forEach(m => {
          html += `
            <div class="search-result-item" onclick="window.app.selectSearchResult('material', '${m.id}')">
              <div>
                <div class="search-result-title">${m.name}</div>
                <div class="search-result-sub">${m.strength} MPa | ${m.weightRating}</div>
              </div>
              <span class="badge badge-cyan">${m.category}</span>
            </div>
          `;
        });
      }

      if (!html) {
        html = `<div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">No matching projects, processes, or materials found.</div>`;
      }

      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  selectSearchResult(type, id) {
    const dropdown = document.getElementById('global-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    if (type === 'project') {
      this.viewHistoryDetail(id);
      this.showToast('Opened project details report', 'info');
    } else if (type === 'process') {
      this.switchView('manufacturing-advisor-page');
      this.openMfgModal(id);
    } else if (type === 'material') {
      this.switchView('material-advisor-page');
      this.showToast('Navigated to Material Advisor', 'info');
    }
  }

  set2DView(mode) {
    if (this.viewer2DInstance) {
      this.viewer2DInstance.setViewMode(mode);
    }
    if (this.standalone2DViewer) {
      this.standalone2DViewer.setViewMode(mode);
    }

    ['2d-view-toggle-btns', 'standalone-2d-view-toggle-btns'].forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.querySelectorAll('button').forEach(btn => {
          if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${mode}'`)) {
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline');
          } else {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline');
          }
        });
      }
  toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');

    const searchDropdown = document.getElementById('global-search-dropdown');
    if (searchDropdown) searchDropdown.classList.add('hidden');
  }

  clearNotifications() {
    const list = document.getElementById('notifications-list-container');
    const badge = document.getElementById('topbar-notif-count');
    if (list) {
      list.innerHTML = `<div style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 0.84rem;">No unread notifications</div>`;
    }
    if (badge) badge.style.display = 'none';
    this.showToast('Notifications cleared', 'info');
  }




  handleLogin() {
    this.isLoggedIn = true;
    this.showToast('Login successful! Welcome to MethodWise AI', 'success');
    this.switchView('dashboard-overview');
  }

  handleLogout() {
    this.isLoggedIn = false;
    this.switchView('login-screen');
    this.showToast('Logged out successfully', 'info');
  }

  switchView(viewId) {
    // Guard check if trying to access dashboard while logged out
    if (!this.isLoggedIn && viewId !== 'login-screen') {
      viewId = 'login-screen';
    }

    this.currentView = viewId;

    // Toggle Login Screen vs App Shell
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');

    if (viewId === 'login-screen') {
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (appShell) appShell.classList.add('hidden');
    } else {
      if (loginScreen) loginScreen.classList.add('hidden');
      if (appShell) appShell.classList.remove('hidden');

      // Hide all sub-views in app shell, show active
      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active');
      });

      const activeSec = document.getElementById(viewId);
      if (activeSec) {
        activeSec.classList.remove('hidden');
        activeSec.classList.add('active');
      }

      // Update active nav link highlight
      document.querySelectorAll('.sidebar-nav-item').forEach(nav => {
        if (nav.getAttribute('data-target-view') === viewId) {
          nav.classList.add('active');
        } else {
          nav.classList.remove('active');
        }
      });

      // Special initializations based on view
      this.onViewActivated(viewId);
    }

    if (window.lucide) window.lucide.createIcons();
    window.scrollTo(0, 0);
  }

  onViewActivated(viewId) {
    if (viewId === 'dashboard-overview') {
      this.renderDashboardStats();
    } else if (viewId === '3d-preview-page') {
      setTimeout(() => {
        if (!this.viewer3DPageInstance && window.CAD3DViewer) {
          this.viewer3DPageInstance = new window.CAD3DViewer('main-3d-canvas-container', {
            autoRotate: true,
            materialStyle: 'metallic'
          });
        }
      }, 100);
    } else if (viewId === 'history-page') {
      this.renderHistoryPage();
    } else if (viewId === 'material-advisor-page') {
      this.renderMaterialAdvisorPage();
    } else if (viewId === 'manufacturing-advisor-page') {
      this.renderManufacturingAdvisorPage();
    } else if (viewId === '2d-blueprint-page') {
      setTimeout(() => {
        if (window.CAD2DViewer) {
          const l = parseFloat(document.getElementById('2d-dim-l')?.value) || 280;
          const w = parseFloat(document.getElementById('2d-dim-w')?.value) || 220;
          const h = parseFloat(document.getElementById('2d-dim-h')?.value) || 180;
          const unit = document.getElementById('2d-dim-unit')?.value || 'mm';
          this.standalone2DViewer = new window.CAD2DViewer('standalone-2d-canvas-container', {
            length: l, width: w, height: h, unit: unit, productName: 'Smart Helmet Assembly'
          });
        }
      }, 100);
    }
  }

  update2DFromControls() {
    const l = parseFloat(document.getElementById('2d-dim-l')?.value) || 280;
    const w = parseFloat(document.getElementById('2d-dim-w')?.value) || 220;
    const h = parseFloat(document.getElementById('2d-dim-h')?.value) || 180;
    const unit = document.getElementById('2d-dim-unit')?.value || 'mm';

    if (this.standalone2DViewer) {
      this.standalone2DViewer.updateDimensions(l, w, h, unit);
    }
  }


  displayAIResults(result) {
    this.currentAnalysisResult = result;
    this.saveProjectToHistory(result);

    // Feature 1: Populate Product Summary Card
    const summaryName = document.getElementById('summary-card-name');
    const summaryMat = document.getElementById('summary-card-material');
    const summaryProc = document.getElementById('summary-card-process');
    const summaryCost = document.getElementById('summary-card-cost');
    const summaryTime = document.getElementById('summary-card-time');

    if (summaryName) summaryName.textContent = result.productName;
    if (summaryMat) summaryMat.textContent = result.recommendedMaterial.name;
    if (summaryProc) summaryProc.textContent = result.recommendedProcess.name;
    if (summaryCost) summaryCost.textContent = result.costBreakdown ? result.costBreakdown.costRangeDisplay : '₹500 - ₹900';
    if (summaryTime) summaryTime.textContent = result.recommendedProcess.leadTime || '3 - 6 Weeks';

    // Populate Hero Summary
    document.getElementById('res-prod-name').textContent = result.productName;
    document.getElementById('res-material-name').textContent = result.recommendedMaterial.name;
    document.getElementById('res-process-name').textContent = result.recommendedProcess.name;
    document.getElementById('res-cost-range').textContent = result.costBreakdown.costRangeDisplay;
    document.getElementById('res-efficiency').textContent = `${result.scores.efficiency}%`;
    document.getElementById('res-score-num').textContent = `${result.scores.overallScore}/10`;

    // Populate Material Recommendation Section
    document.getElementById('res-mat-selected').textContent = result.recommendedMaterial.name;
    document.getElementById('res-mat-reason').textContent = result.explanations.selectionReason;

    const advUl = document.getElementById('res-mat-advantages');
    if (advUl) {
      advUl.innerHTML = result.explanations.advantages.map(a => `<li><i data-lucide="check-circle" class="icon-success"></i> ${a}</li>`).join('');
    }

    const limUl = document.getElementById('res-mat-limitations');
    if (limUl) {
      limUl.innerHTML = result.explanations.limitations.map(l => `<li><i data-lucide="alert-triangle" class="icon-warning"></i> ${l}</li>`).join('');
    }

    // Populate Manufacturing Section
    document.getElementById('res-mfg-best').textContent = result.recommendedProcess.name;
    document.getElementById('res-mfg-explanation').textContent = result.explanations.processExplanation;

    const mfgBenUl = document.getElementById('res-mfg-benefits');
    if (mfgBenUl) {
      mfgBenUl.innerHTML = result.explanations.productionBenefits.map(b => `<li><i data-lucide="zap" class="icon-accent"></i> ${b}</li>`).join('');
    }

    // Feature 7: Populate Material Specification Info Card
    const matInfoCard = document.getElementById('res-material-info-card');
    if (matInfoCard && result.recommendedMaterial) {
      const rm = result.recommendedMaterial;
      matInfoCard.innerHTML = `
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Material Name</span><div style="font-weight: 700; color: var(--accent-cyan);">${rm.name}</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Tensile Strength</span><div style="font-weight: 700;">${rm.strength || 310} MPa</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Density / Weight</span><div style="font-weight: 700;">${rm.density || 2.7} g/cm³ (${rm.weightRating || 'Lightweight'})</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Heat Resistance</span><div style="font-weight: 700;">${rm.tempResistance || 150}°C</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Cost Level</span><div style="font-weight: 700; color: var(--accent-emerald);">${rm.costDisplay || 'Moderate'}</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Recyclability</span><div style="font-weight: 700; color: var(--accent-emerald);">95% (High Recyclable)</div></div>
      `;
    }

    // Feature 5: Populate Dynamic Process-Specific DFM Tips
    const dynamicTipsUl = document.getElementById('res-dynamic-tips-ul');
    if (dynamicTipsUl) {
      const procId = (result.recommendedProcess.id || 'injection-molding');
      const tipsList = (window.METHODWISE_DATA.DYNAMIC_TIPS && window.METHODWISE_DATA.DYNAMIC_TIPS[procId]) || window.METHODWISE_DATA.AI_TIPS;
      dynamicTipsUl.innerHTML = tipsList.map(tip => `
        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem;">
          <i data-lucide="check-circle-2" class="icon-accent" style="width: 16px; margin-top: 3px;"></i>
          <span>${tip}</span>
        </li>
      `).join('');
    }

    // Feature 6: Populate Alternative Manufacturing Process Suggestions
    const altGrid = document.getElementById('res-alternative-processes-grid');
    if (altGrid && window.METHODWISE_DATA.PROCESSES) {
      const alternatives = window.METHODWISE_DATA.PROCESSES.filter(p => p.id !== result.recommendedProcess.id).slice(0, 3);
      altGrid.innerHTML = alternatives.map(alt => `
        <div class="glass-card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 1rem; color: var(--accent-cyan);">${alt.name}</h4>
            <span class="badge badge-emerald">${alt.category || 'Alternative'}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.3;">${alt.description.slice(0, 80)}...</p>
          <div style="font-size: 0.78rem; color: var(--text-dim);">Accuracy: <strong>${alt.accuracy}</strong> | Lead Time: <strong>${alt.leadTime}</strong></div>
          <button class="btn btn-outline btn-sm" style="margin-top: 8px;" onclick="window.app.openMfgModal('${alt.id}')">
            <i data-lucide="info"></i> View Details
          </button>
        </div>
      `).join('');
    }

    // Populate Cost Breakdown Table
    const cb = result.costBreakdown;
    document.getElementById('cost-mat-val').textContent = `₹${cb.materialCost.toLocaleString()}`;
    document.getElementById('cost-mfg-val').textContent = `₹${cb.manufacturingCost.toLocaleString()}`;
    document.getElementById('cost-asm-val').textContent = `₹${cb.assemblyCost.toLocaleString()}`;
    document.getElementById('cost-total-val').textContent = `₹${cb.totalPerUnit.toLocaleString()}`;

    // Render Circular AI Performance Gauges
    if (window.ChartRenderer) {
      window.ChartRenderer.renderCircularGauge('gauge-strength', result.scores.strengthScore, 'Strength Score', '#00f2fe');
      window.ChartRenderer.renderCircularGauge('gauge-cost', result.scores.costScore, 'Cost Efficiency', '#10b981');
      window.ChartRenderer.renderCircularGauge('gauge-sustainability', result.scores.sustainabilityScore, 'Sustainability', '#3b82f6');
      window.ChartRenderer.renderCircularGauge('gauge-manufacturability', result.scores.manufacturabilityScore, 'Manufacturability (DFM)', '#7928ca');
    }

    // Instantiate / Render 2D Technical CAD Blueprint Visualizer
    if (window.CAD2DViewer) {
      setTimeout(() => {
        const dim = result.dimensions || { length: 280, width: 220, height: 180, unit: 'mm' };
        this.viewer2DInstance = new window.CAD2DViewer('results-2d-canvas-container', {
          length: dim.length,
          width: dim.width,
          height: dim.height,
          unit: dim.unit,
          productName: result.productName,
          viewMode: 'front'
        });
      }, 100);
    }

    if (window.lucide) window.lucide.createIcons();
    this.switchView('ai-results-page');
  }


  saveProjectToHistory(result) {
    const newProj = {
      id: 'proj-' + Date.now().toString().slice(-4),
      name: result.productName,
      type: result.productType,
      date: new Date().toISOString().split('T')[0],
      material: result.recommendedMaterial.name,
      process: result.recommendedProcess.name,
      costRange: result.costBreakdown.costRangeDisplay,
      unitCost: result.costBreakdown.totalPerUnit,
      efficiency: result.scores.efficiency,
      score: result.scores.overallScore,
      strengthScore: result.scores.strengthScore,
      sustainabilityScore: result.scores.sustainabilityScore,
      manufacturabilityScore: result.scores.manufacturabilityScore,
      dimensions: result.dimensions,
      quantity: result.dimensions.quantity || 1000,
      description: `${result.productName} designed with ${result.recommendedMaterial.name} using ${result.recommendedProcess.name}.`
    };

    this.savedProjects.unshift(newProj);
    localStorage.setItem('methodwise_projects', JSON.stringify(this.savedProjects));
  }

  loadSavedProjects() {
    const defaults = window.METHODWISE_DATA.PROJECTS || [];
    const stored = localStorage.getItem('methodwise_projects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const storedIds = new Set(parsed.map(p => p.id));
        defaults.forEach(d => {
          if (!storedIds.has(d.id)) {
            parsed.push(d);
          }
        });
        this.savedProjects = parsed;
      } catch (e) {
        this.savedProjects = defaults;
      }
    } else {
      this.savedProjects = defaults;
      localStorage.setItem('methodwise_projects', JSON.stringify(this.savedProjects));
    }
  }

  renderHistoryPage() {
    const container = document.getElementById('history-cards-grid');
    if (!container) return;

    if (this.savedProjects.length === 0) {
      container.innerHTML = `<div class="empty-state-box">No saved projects yet. Create a product design to see history!</div>`;
      return;
    }

    container.innerHTML = this.savedProjects.map(p => `
      <div class="project-card">
        <div class="project-card-header">
          <span class="project-type-badge">${p.type}</span>
          <span class="project-score-badge">AI Score: <strong>${p.score}</strong>/10</span>
        </div>
        <h3 class="project-card-title">${p.name}</h3>
        <p class="project-card-date">Created: ${p.date}</p>
        
        <div class="project-card-details">
          <div class="p-detail"><span>Material:</span> <strong>${p.material}</strong></div>
          <div class="p-detail"><span>Process:</span> <strong>${p.process}</strong></div>
          <div class="p-detail"><span>Est. Unit Cost:</span> <strong class="cost-accent">${p.costRange || ('₹' + p.unitCost)}</strong></div>
        </div>

        <div class="project-card-actions">
          <button class="btn btn-sm btn-outline" onclick="window.app.viewHistoryDetail('${p.id}')">
            <i data-lucide="eye"></i> View Report
          </button>
          <button class="btn btn-sm btn-ghost text-danger" onclick="window.app.deleteProject('${p.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  viewHistoryDetail(projId) {
    const p = this.savedProjects.find(x => x.id === projId);
    if (!p) return;

    // Simulate result display for this project
    const mockResult = {
      productName: p.name,
      productType: p.type,
      targetUsage: 'High Performance Standard',
      dimensions: p.dimensions || { length: 200, width: 150, height: 100, weight: 600, unit: 'mm' },
      recommendedMaterial: { name: p.material, advantages: ['High strength', 'Cost optimal'], limitations: ['Requires surface coating'] },
      recommendedProcess: { name: p.process, benefits: ['Mass production feasibility', 'High repeatability'] },
      costBreakdown: {
        materialCost: Math.round(p.unitCost * 0.4),
        manufacturingCost: Math.round(p.unitCost * 0.45),
        assemblyCost: Math.round(p.unitCost * 0.15),
        totalPerUnit: p.unitCost,
        costRangeDisplay: p.costRange || `₹${p.unitCost}`
      },
      scores: {
        strengthScore: p.strengthScore || 85,
        costScore: 88,
        sustainabilityScore: p.sustainabilityScore || 75,
        manufacturabilityScore: p.manufacturabilityScore || 90,
        overallScore: p.score,
        efficiency: p.efficiency || 86
      },
      explanations: {
        selectionReason: `${p.material} delivers structural integrity for ${p.name}.`,
        advantages: ['High structural strength', 'Excellent wear properties'],
        limitations: ['Requires precision tooling setup'],
        processExplanation: `${p.process} is optimized for volume batching.`,
        productionBenefits: ['High dimensional repeatability', 'Minimal per-unit assembly overhead']
      }
    };

    this.displayAIResults(mockResult);
  }

  deleteProject(projId) {
    if (confirm('Are you sure you want to remove this design record?')) {
      this.savedProjects = this.savedProjects.filter(p => p.id !== projId);
      localStorage.setItem('methodwise_projects', JSON.stringify(this.savedProjects));
      this.renderHistoryPage();
      this.showToast('Project removed from history', 'info');
    }
  }

  renderDashboardStats() {
    // Render Quick Stats values
    document.getElementById('dash-stat-active').textContent = this.savedProjects.length;
    const statAnalyses = document.getElementById('dash-stat-analyses');
    if (statAnalyses) statAnalyses.textContent = (this.savedProjects.length * 4);
    const statSaved = document.getElementById('dash-stat-saved');
    if (statSaved) statSaved.textContent = this.savedProjects.length;
    document.getElementById('dash-stat-accuracy').textContent = '99.4%';

    // Render Recent Activity List (Last 5 Analyzed Products with View button)
    const actList = document.getElementById('dash-recent-activity');
    if (actList) {
      actList.innerHTML = this.savedProjects.slice(0, 5).map(p => `
        <div class="dash-activity-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(8, 13, 26, 0.6); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="activity-icon"><i data-lucide="check-circle-2" style="color: var(--accent-emerald);"></i></div>
            <div class="activity-info">
              <h4 style="font-size: 0.92rem; margin-bottom: 2px;">${p.name}</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted);">${p.process} | ${p.material} (${p.date})</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-cyan" style="font-size: 0.75rem;">Score: ${p.score}/10</span>
            <button class="btn btn-outline btn-sm" onclick="window.app.viewHistoryDetail('${p.id}')">View</button>
          </div>
        </div>
      `).join('');
    }

    // Render Favorite Materials list on Dashboard
    this.renderFavoriteMaterials();
    if (window.lucide) window.lucide.createIcons();
  }

  renderFavoriteMaterials() {
    const container = document.getElementById('dash-favorite-materials');
    if (!container) return;

    const favorites = JSON.parse(localStorage.getItem('methodwise_fav_materials') || '["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"]');
    container.innerHTML = favorites.map(name => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(8, 13, 26, 0.6); border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.84rem;">
        <span style="font-weight: 600; color: var(--text-main);"><i data-lucide="flask-conical" class="icon-accent" style="width: 14px;"></i> ${name}</span>
        <button class="btn-favorite is-favorite" style="width: 26px; height: 26px; font-size: 0.75rem;" onclick="window.app.toggleFavoriteMaterial('${name}')" title="Remove Favorite">
          <i data-lucide="heart"></i>
        </button>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  toggleFavoriteMaterial(name) {
    let favorites = JSON.parse(localStorage.getItem('methodwise_fav_materials') || '["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"]');
    if (favorites.includes(name)) {
      favorites = favorites.filter(x => x !== name);
      this.showToast(`Removed ${name} from favorites`, 'info');
    } else {
      favorites.push(name);
      this.showToast(`Added ${name} to favorites ❤️`, 'success');
    }
    localStorage.setItem('methodwise_fav_materials', JSON.stringify(favorites));
    this.renderFavoriteMaterials();
  }

  exportExcel() {
    if (!this.savedProjects || this.savedProjects.length === 0) {
      this.showToast('No projects available to export.', 'warning');
      return;
    }
    const headers = ['Project ID', 'Product Name', 'Category', 'Material', 'Process', 'Unit Cost', 'AI Score', 'Date'];
    const rows = this.savedProjects.map(p => [
      p.id, `"${p.name}"`, `"${p.type}"`, `"${p.material}"`, `"${p.process}"`, p.unitCost || 0, p.score || 9.0, p.date
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MethodWise_Engineering_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Engineering CSV Report exported successfully!', 'success');
  }


  renderMaterialAdvisorPage() {
    const tableBody = document.getElementById('mat-advisor-tbody');
    if (!tableBody) return;

    const data = window.METHODWISE_DATA.MATERIALS;
    const all = [...data.metals, ...data.plastics, ...data.composites];

    tableBody.innerHTML = all.map(m => {
      const favs = JSON.parse(localStorage.getItem('methodwise_fav_materials') || '["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"]');
      const isFav = favs.includes(m.name);
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <strong>${m.name}</strong>
              <button class="btn-favorite ${isFav ? 'is-favorite' : ''}" style="width: 28px; height: 28px; font-size: 0.75rem;" onclick="window.app.toggleFavoriteMaterial('${m.name}')" title="Favorite Material">
                <i data-lucide="heart"></i>
              </button>
            </div>
          </td>
          <td><span class="material-cat-badge badge-${m.category.toLowerCase()}">${m.category}</span></td>
          <td>${m.strength} MPa</td>
          <td>${m.density} g/cm³</td>
          <td>${m.durability}%</td>
          <td>${m.tempResistance}°C</td>
          <td>${m.costDisplay}</td>
        </tr>
      `;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  renderManufacturingAdvisorPage() {
    const data = window.METHODWISE_DATA;
    if (!data || !data.PROCESSES) return;

    // 1. Render Process Suitability Progress Bars
    const suitabilityContainer = document.getElementById('mfg-suitability-bars-container');
    if (suitabilityContainer) {
      suitabilityContainer.innerHTML = data.PROCESSES.map(p => `
        <div class="progress-bar-item">
          <div class="progress-bar-info">
            <span><strong>${p.name}</strong> <span style="font-size: 0.78rem; color: var(--text-muted);">(${p.category || 'General'})</span></span>
            <span style="font-weight: 700; color: var(--accent-cyan);">${p.suitability || 90}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${p.suitability || 90}%;"></div>
          </div>
        </div>
      `).join('');
    }

    // 2. Render Cost Breakdown Items
    const costContainer = document.getElementById('mfg-cost-breakdown-list');
    if (costContainer && data.COST_BREAKDOWN) {
      costContainer.innerHTML = data.COST_BREAKDOWN.map(c => `
        <div class="progress-bar-item">
          <div class="progress-bar-info">
            <span>${c.name}</span>
            <span><strong style="color: ${c.color};">${c.val}</strong> <span style="font-size: 0.78rem; color: var(--text-muted);">(${c.percent}%)</span></span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${c.percent}%; background: ${c.color};"></div>
          </div>
        </div>
      `).join('') + `
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total Estimated Cost / Unit</span>
          <span style="color: var(--accent-emerald); font-size: 1.1rem;">₹800</span>
        </div>
      `;
    }

    // 3. Render Quality Prediction Circular Meters
    const qualityContainer = document.getElementById('mfg-quality-meters-grid');
    if (qualityContainer && data.QUALITY_PREDICTION) {
      qualityContainer.innerHTML = data.QUALITY_PREDICTION.map(q => `
        <div class="quality-meter-box">
          <div style="font-size: 1.6rem; font-weight: 800; color: ${q.color}; font-family: var(--font-heading); margin-bottom: 2px;">${q.score}%</div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${q.name}</span>
        </div>
      `).join('');
    }

    // 4. Render Material Compatibility Star Rated Cards
    const matCompatContainer = document.getElementById('mfg-material-compat-grid');
    if (matCompatContainer && data.MATERIAL_COMPATIBILITY) {
      matCompatContainer.innerHTML = data.MATERIAL_COMPATIBILITY.map(m => {
        const fullStars = Math.floor(m.starRating);
        const halfStar = m.starRating % 1 !== 0;
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '★';
        if (halfStar) starsHtml += '½';
        return `
          <div class="glass-card compat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 style="font-size: 1.05rem; color: var(--accent-cyan);">${m.name}</h4>
              <span class="badge badge-emerald">${m.category}</span>
            </div>
            <div class="star-rating-row">${starsHtml} <span style="font-size: 0.8rem; color: var(--text-muted);">(${m.starRating}/5)</span></div>
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.3;">${m.description}</p>
            <div style="background: rgba(8, 13, 26, 0.6); padding: 10px; border-radius: var(--radius-sm); font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px;">
              <div><span>Strength:</span> <strong>${m.strength}</strong></div>
              <div><span>Cost Level:</span> <strong>${m.costLevel}</strong></div>
              <div><span>Heat Deflection:</span> <strong>${m.heatResistance}</strong></div>
              <div><span>Manufacturability:</span> <strong style="color: var(--accent-emerald);">${m.manufacturability}</strong></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 5. Render AI DFM Suggestions & Tips
    const tipsUl = document.getElementById('mfg-ai-tips-ul');
    if (tipsUl && data.AI_TIPS) {
      tipsUl.innerHTML = data.AI_TIPS.map(tip => `
        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem;">
          <i data-lucide="check-circle" class="icon-accent" style="width: 16px; margin-top: 3px;"></i>
          <span>${tip}</span>
        </li>
      `).join('');
    }

    // 6. Render Advantages & Limitations lists
    const advUl = document.getElementById('mfg-advantages-ul');
    const limUl = document.getElementById('mfg-limitations-ul');
    if (advUl && data.ADVANTAGES_LIMITATIONS) {
      advUl.innerHTML = data.ADVANTAGES_LIMITATIONS.advantages.map(a => `
        <li><i data-lucide="check-circle-2" class="icon-success"></i> ${a}</li>
      `).join('');
    }
    if (limUl && data.ADVANTAGES_LIMITATIONS) {
      limUl.innerHTML = data.ADVANTAGES_LIMITATIONS.limitations.map(l => `
        <li><i data-lucide="alert-triangle" class="icon-warning"></i> ${l}</li>
      `).join('');
    }

    // 7. Render Horizontal Production Timeline
    const timelineContainer = document.getElementById('mfg-timeline-track');
    if (timelineContainer && data.PRODUCTION_TIMELINE) {
      timelineContainer.innerHTML = data.PRODUCTION_TIMELINE.map((step) => `
        <div class="timeline-step-node ${step.status.toLowerCase()}">
          <div class="step-dot-icon"><i data-lucide="${step.icon || 'circle'}"></i></div>
          <div class="timeline-step-title">${step.title}</div>
          <div class="timeline-step-desc">${step.desc}</div>
        </div>
      `).join('');
    }

    // 8. Render Alternative Manufacturing Methods Chips
    const altChipsContainer = document.getElementById('mfg-alt-chips-container');
    if (altChipsContainer && data.ALTERNATIVE_METHODS) {
      altChipsContainer.innerHTML = data.ALTERNATIVE_METHODS.map(alt => `
        <div class="alt-chip" onclick="window.app.showToast('Alternative Method: ${alt.name} (${alt.accuracy}) - ${alt.bestFor}', 'info')">
          <i data-lucide="${alt.icon}"></i>
          <span>${alt.name}</span>
          <span style="font-size: 0.75rem; color: var(--text-dim);">(${alt.accuracy})</span>
        </div>
      `).join('');
    }

    // 9. Render Process Comparison Table
    const tbody = document.getElementById('mfg-comparison-tbody');
    if (tbody && data.PROCESSES) {
      tbody.innerHTML = data.PROCESSES.map(p => `
        <tr>
          <td>
            <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="${p.icon}" class="icon-accent" style="width: 16px;"></i> ${p.name}
            </div>
          </td>
          <td>${p.bestForQty}</td>
          <td><span style="color: var(--accent-cyan); font-weight: bold;">${p.accuracy}</span></td>
          <td>${p.leadTime}</td>
          <td>${p.initialToolingCost}</td>
          <td>${p.surfaceFinish}</td>
          <td><span class="badge badge-cyan">${(p.applications && p.applications[0]) || 'General'}</span></td>
        </tr>
      `).join('');
    }

    // 10. Render Main Process Cards
    this.renderMfgCards(data.PROCESSES);

    // 11. Bind Search and Filter listeners
    this.bindMfgFilterEvents();

    if (window.lucide) window.lucide.createIcons();
  }

  renderMfgCards(processes) {
    const grid = document.getElementById('mfg-advisor-grid');
    if (!grid) return;

    if (!processes || processes.length === 0) {
      grid.innerHTML = `<div class="empty-state-box" style="grid-column: 1/-1;">No manufacturing processes match your search filter criteria.</div>`;
      return;
    }

    grid.innerHTML = processes.map(p => `
      <div class="mfg-advisor-card glass-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div class="mfg-card-icon"><i data-lucide="${p.icon}"></i></div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge badge-emerald">${p.category || 'Standard'}</span>
            <button class="btn-favorite ${this.isFavoriteProcess(p.id) ? 'is-favorite' : ''}" onclick="window.app.toggleFavoriteProcess('${p.id}')" title="Save to Favorites">
              <i data-lucide="heart"></i>
            </button>
          </div>
        </div>
        <h3 style="font-size: 1.2rem; margin-bottom: 6px;">${p.name}</h3>
        <p class="mfg-card-desc" style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 16px; min-height: 48px;">${p.description}</p>
        
        <div class="mfg-specs-list" style="margin-bottom: 18px;">
          <div><span>Best Quantity:</span> <strong>${p.bestForQty}</strong></div>
          <div><span>Lead Time:</span> <strong>${p.leadTime}</strong></div>
          <div><span>Accuracy:</span> <strong>${p.accuracy}</strong></div>
          <div><span>Surface Finish:</span> <strong>${p.surfaceFinish}</strong></div>
          <div><span>Initial Tooling:</span> <strong>${p.initialToolingCost}</strong></div>
        </div>

        <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="window.app.openMfgModal('${p.id}')">
          <i data-lucide="info"></i> View Details & Capabilities
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem('methodwise_favorites')) || ['injection-molding'];
    } catch(e) { return ['injection-molding']; }
  }

  toggleFavoriteProcess(id) {
    if (!this.favorites) this.favorites = this.loadFavorites();
    if (this.favorites.includes(id)) {
      this.favorites = this.favorites.filter(x => x !== id);
      this.showToast('Removed process from Favorites', 'info');
    } else {
      this.favorites.push(id);
      this.showToast('Added process to Favorites ❤️', 'success');
    }
    localStorage.setItem('methodwise_favorites', JSON.stringify(this.favorites));
    this.renderManufacturingAdvisorPage();
  }

  isFavoriteProcess(id) {
    if (!this.favorites) this.favorites = this.loadFavorites();
    return this.favorites.includes(id);
  }

  openHelpModal() {
    const overlay = document.getElementById('help-modal-overlay');
    const container = document.getElementById('help-terms-container');
    if (!overlay || !container) return;

    const terms = window.METHODWISE_DATA.HELP_TERMS || {};
    container.innerHTML = Object.keys(terms).map(key => `
      <div style="background: rgba(8, 13, 26, 0.6); padding: 14px 18px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-cyan);">
        <h4 style="font-size: 0.98rem; color: var(--accent-cyan); margin-bottom: 4px;">${key}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${terms[key]}</p>
      </div>
    `).join('');

    overlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  closeHelpModal() {
    const overlay = document.getElementById('help-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }


  bindMfgFilterEvents() {
    const searchInput = document.getElementById('mfg-search-input');
    const filterPills = document.querySelectorAll('#mfg-filter-pills-container .filter-pill');

    if (searchInput) {
      searchInput.oninput = () => this.applyMfgFilters();
    }

    filterPills.forEach(pill => {
      pill.onclick = () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.applyMfgFilters();
      };
    });
  }

  applyMfgFilters() {
    const searchVal = (document.getElementById('mfg-search-input')?.value || '').toLowerCase().trim();
    const activePill = document.querySelector('#mfg-filter-pills-container .filter-pill.active');
    const category = activePill ? activePill.getAttribute('data-filter') : 'all';

    let allProcesses = window.METHODWISE_DATA.PROCESSES || [];

    let filtered = allProcesses.filter(p => {
      // Category match
      let matchCat = (category === 'all') || (p.category === category);

      // Search match
      let searchBlob = `${p.name} ${p.description} ${p.bestForQty} ${p.accuracy} ${(p.suitableMaterials || []).join(' ')} ${(p.applications || []).join(' ')}`.toLowerCase();
      let matchSearch = !searchVal || searchBlob.includes(searchVal);

      return matchCat && matchSearch;
    });

    this.renderMfgCards(filtered);
  }

  openMfgModal(processId) {
    const p = window.METHODWISE_DATA.PROCESSES.find(x => x.id === processId);
    if (!p) return;

    const overlay = document.getElementById('mfg-modal-overlay');
    const content = document.getElementById('mfg-modal-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
        <div class="mfg-card-icon" style="width: 44px; height: 44px; font-size: 1.2rem;"><i data-lucide="${p.icon}"></i></div>
        <div>
          <h2 style="font-size: 1.6rem;">${p.name}</h2>
          <span class="badge badge-cyan">${p.category || 'Manufacturing Process'}</span>
        </div>
      </div>

      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px; line-height: 1.6;">${p.description}</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; background: rgba(8, 13, 26, 0.6); padding: 18px; border-radius: var(--radius-md);">
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin-bottom: 8px;">Suitable Materials:</h4>
          <ul class="bullets-list">
            ${(p.suitableMaterials || ['ABS', 'Aluminum', 'Nylon']).map(m => `<li>${m}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin-bottom: 8px;">Typical Applications:</h4>
          <ul class="bullets-list">
            ${(p.applications || ['Housings', 'Brackets']).map(app => `<li>${app}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-emerald); margin-bottom: 8px;">Key Advantages:</h4>
          <ul class="bullets-list">
            ${(p.advantages || p.benefits).map(a => `<li><i data-lucide="check-circle" class="icon-success"></i> ${a}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-amber); margin-bottom: 8px;">Process Limitations:</h4>
          <ul class="bullets-list">
            ${(p.limitations || ['Tooling cost']).map(l => `<li><i data-lucide="alert-triangle" class="icon-warning"></i> ${l}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div style="background: rgba(15, 23, 42, 0.8); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.88rem; display: flex; flex-direction: column; gap: 8px;">
        <div><span>Industry Focus:</span> <strong>${(p.industries || ['Automotive', 'Electronics']).join(', ')}</strong></div>
        <div><span>Machine Equipment Types:</span> <strong>${(p.machineTypes || ['CNC Milling']).join(' / ')}</strong></div>
        <div><span>Typical Batch Production Volume:</span> <strong>${p.typicalVolume || p.bestForQty}</strong></div>
      </div>
    `;

    overlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  closeMfgModal() {
    const overlay = document.getElementById('mfg-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  exportMfgReportPDF() {
    this.downloadReport();
  }

  exportMfgCostCSV() {
    const data = window.METHODWISE_DATA.PROCESSES || [];
    let csvContent = "data:text/csv;charset=utf-8,Process Name,Category,Quantity Range,Lead Time,Accuracy,Surface Finish,Initial Tooling\n";
    data.forEach(p => {
      csvContent += `"${p.name}","${p.category || ''}","${p.bestForQty}","${p.leadTime}","${p.accuracy}","${p.surfaceFinish}","${p.initialToolingCost}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MethodWise_Manufacturing_Cost_Analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Cost Analysis CSV exported successfully', 'success');
  }


  openCadModal() {
    alert('⚡ CAD Model Generator Simulation:\nGenerating native 3D STEP & STL geometry models based on your engineering requirements...\n\nFiles ready: Smart_Product_Model_v1.STEP (14.2 MB), Smart_Product_Model_v1.STL (8.5 MB)');
  }

  openProtoModal() {
    alert('🛠️ Rapid Prototyping Supplier Quote:\nEstimated SLS / CNC Rapid Prototype Lead Time: 48 Hours\nSupplier Partner: MethodWise Direct Fabrication Lab\nEstimated Cost: ₹2,400 per sample');
  }

  downloadReport() {
    const res = this.currentAnalysisResult || { productName: 'Smart Product', recommendedMaterial: { name: 'ABS Plastic' }, recommendedProcess: { name: 'Injection Molding' }, costBreakdown: { costRangeDisplay: '₹500 - ₹900' } };
    
    // Trigger printable engineering report window
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>MethodWise AI Engineering Report - ${res.productName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #00f2fe; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #0f172a; margin: 0; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
            .section { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MethodWise AI – Smart Product Design Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <div class="section">
            <h2>Product Details</h2>
            <p><strong>Product Name:</strong> ${res.productName}</p>
            <p><strong>Product Type:</strong> ${res.productType || 'Consumer Product'}</p>
          </div>
          <div class="section">
            <h2>AI Recommendation Summary</h2>
            <p><strong>Recommended Material:</strong> <span class="badge">${res.recommendedMaterial.name}</span></p>
            <p><strong>Recommended Manufacturing Process:</strong> <span class="badge">${res.recommendedProcess.name}</span></p>
            <p><strong>Estimated Unit Cost:</strong> ${res.costBreakdown ? res.costBreakdown.costRangeDisplay : '₹500 - ₹900'}</p>
          </div>
          <div class="section">
            <h2>Cost Structure Analysis</h2>
            <table>
              <tr><th>Component</th><th>Cost per Unit</th></tr>
              <tr><td>Material Cost</td><td>₹${res.costBreakdown ? res.costBreakdown.materialCost : 400}</td></tr>
              <tr><td>Manufacturing & Tooling</td><td>₹${res.costBreakdown ? res.costBreakdown.manufacturingCost : 300}</td></tr>
              <tr><td>Assembly & Quality Inspection</td><td>₹${res.costBreakdown ? res.costBreakdown.assemblyCost : 100}</td></tr>
              <tr><th>Total Estimated Cost</th><th>${res.costBreakdown ? res.costBreakdown.costRangeDisplay : '₹800'}</th></tr>
            </table>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  }

  showToast(msg, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i>
      <span>${msg}</span>
    `;
    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  initAuthCanvas() {
    const canvas = document.getElementById('auth-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw node particles & interconnects
      ctx.fillStyle = 'rgba(0, 242, 254, 0.6)';
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(0, 242, 254, ${0.2 * (1 - dist / 140)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    }
    draw();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new MethodWiseApp();
  window.app.init();
});
