/**
 * MethodWise AI - Mobile UI Components & Views Renderer
 * Handles touch-optimized mobile screens for Android App.
 */

class MobileUIComponents {
  constructor(appController) {
    this.app = appController;
  }

  // --- 1. Login View ---
  renderLoginView() {
    return `
      <div class="mobile-card" style="margin-top: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <i data-lucide="cpu" style="color: #fff; width: 32px; height: 32px;"></i>
        </div>
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; margin-bottom: 4px;">MethodWise AI</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 20px;">Smart Product Design & Manufacturing Decision Advisor</p>

        <form id="m-login-form">
          <div class="mobile-form-group" style="text-align: left;">
            <label class="mobile-label">Work Email</label>
            <input type="email" id="m-login-email" class="mobile-input" value="engineer@methodwise.ai" required>
          </div>

          <div class="mobile-form-group" style="text-align: left;">
            <label class="mobile-label">Password</label>
            <input type="password" id="m-login-password" class="mobile-input" value="demo12345" required>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 20px; color: var(--text-muted);">
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" id="m-remember-me" checked> Remember me
            </label>
            <a href="#" style="color: var(--accent-cyan); text-decoration: none;" onclick="alert('Password reset link sent to registered email.'); return false;">Forgot?</a>
          </div>

          <button type="submit" class="m-btn m-btn-primary" style="margin-bottom: 10px;">
            <i data-lucide="log-in"></i> Sign In to Mobile App
          </button>

          <button type="button" class="m-btn m-btn-outline" id="m-demo-login-btn">
            <i data-lucide="zap"></i> Quick Demo Auto-Login
          </button>
        </form>
      </div>
    `;
  }

  // --- 2. Dashboard View ---
  renderDashboardView() {
    const projects = window.MethodWiseSync.getProjects();
    const favs = window.MethodWiseSync.getFavorites();

    return `
      <div style="margin-bottom: 14px;">
        <span class="m-badge m-badge-emerald"><i data-lucide="activity" style="width: 12px;"></i> AI Engine Active</span>
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; margin-top: 6px;">Mobile Dashboard</h2>
      </div>

      <!-- KPI Stat Cards -->
      <div class="stat-grid-mobile">
        <div class="stat-box-mobile">
          <span class="stat-box-num">${projects.length}</span>
          <span class="stat-box-lbl">Saved Projects</span>
        </div>
        <div class="stat-box-mobile">
          <span class="stat-box-num">${projects.length * 4}</span>
          <span class="stat-box-lbl">AI DFM Runs</span>
        </div>
        <div class="stat-box-mobile">
          <span class="stat-box-num">99.4%</span>
          <span class="stat-box-lbl">DFM Accuracy</span>
        </div>
        <div class="stat-box-mobile">
          <span class="stat-box-num">${favs.length}</span>
          <span class="stat-box-lbl">Fav Materials</span>
        </div>
      </div>

      <!-- Quick Action Card -->
      <div class="mobile-card" style="background: linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(121, 40, 202, 0.15)); border: 1px solid var(--border-cyan);">
        <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px;">Start New Design Advisor Run</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Input structural requirements, target batch volume, and dimensions for instant AI evaluation.</p>
        <button class="m-btn m-btn-primary" onclick="window.mobileApp.switchTab('create')">
          <i data-lucide="plus-circle"></i> Create Product Design
        </button>
      </div>

      <!-- Recent Projects Mobile List -->
      <div class="mobile-card">
        <div class="mobile-card-title">
          <span>📌 Recent Projects</span>
          <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 500;" onclick="window.mobileApp.switchTab('history')">View All</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${projects.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-muted);">No projects saved yet.</p>' : projects.slice(0, 4).map(p => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm);" onclick="window.mobileApp.viewHistoryDetail('${p.id}')">
              <div>
                <div style="font-size: 0.88rem; font-weight: 600;">${p.name}</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">${p.process} | ${p.material}</div>
              </div>
              <span class="m-badge m-badge-cyan">Score ${p.score || 9}/10</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Favorite Materials Card -->
      <div class="mobile-card">
        <div class="mobile-card-title">🧪 Favorite Engineering Materials</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${favs.map(f => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-input); border-radius: var(--radius-sm); font-size: 0.84rem;">
              <span><i data-lucide="flask-conical" style="width: 14px; color: var(--accent-cyan);"></i> ${f}</span>
              <button class="icon-btn" style="width: 28px; height: 28px;" onclick="window.mobileApp.toggleFavorite('${f}')">
                <i data-lucide="heart" style="width: 14px; color: var(--accent-rose);"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- 3. Create Wizard View ---
  renderCreateWizardView() {
    return `
      <div class="mobile-card">
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin-bottom: 4px;">Create Product Requirement</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">Step-by-step engineering wizard for AI DFM & material optimization.</p>

        <form id="m-wizard-form">
          <div class="mobile-form-group">
            <label class="mobile-label">Product Name</label>
            <input type="text" id="m-wiz-name" class="mobile-input" placeholder="e.g. Smart Drone Arm Component" value="Smart Helmet Shell" required>
          </div>

          <div class="mobile-form-group">
            <label class="mobile-label">Product Category / Industry</label>
            <select id="m-wiz-type" class="mobile-select">
              <option value="Consumer Electronics">Consumer Electronics</option>
              <option value="Automotive Parts">Automotive Components</option>
              <option value="Aerospace Structural">Aerospace Structural</option>
              <option value="Medical Device">Medical Device</option>
              <option value="Industrial Machinery">Industrial Equipment</option>
            </select>
          </div>

          <div class="mobile-form-group">
            <label class="mobile-label">Mechanical Strength Target</label>
            <select id="m-wiz-strength" class="mobile-select">
              <option value="low">Standard / Light Duty (30 - 100 MPa)</option>
              <option value="medium" selected>Medium Strength (100 - 350 MPa)</option>
              <option value="high">High Structural Load (350 - 600 MPa)</option>
              <option value="extreme">Extreme Aerospace Load (> 600 MPa)</option>
            </select>
          </div>

          <div class="mobile-form-group">
            <label class="mobile-label">Environmental & Thermal Exposure</label>
            <select id="m-wiz-temp" class="mobile-select">
              <option value="ambient" selected>Ambient Indoor / Room Temp</option>
              <option value="outdoor">Outdoor UV & Weathering</option>
              <option value="high-temp">High Heat Exposure (> 150°C)</option>
              <option value="chemical">Corrosive / Chemical Exposure</option>
            </select>
          </div>

          <div class="mobile-form-group">
            <label class="mobile-label">Expected Production Batch Volume</label>
            <input type="range" id="m-wiz-qty-slider" min="10" max="50000" step="50" value="5000" style="width: 100%; accent-color: var(--accent-cyan);" oninput="document.getElementById('m-qty-val').textContent = parseInt(this.value).toLocaleString() + ' units'">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan); text-align: right; margin-top: 4px;" id="m-qty-val">5,000 units</div>
          </div>

          <button type="submit" class="m-btn m-btn-primary" style="margin-top: 10px;">
            <i data-lucide="cpu"></i> Generate AI Recommendation
          </button>
        </form>
      </div>
    `;
  }

  // --- 4. AI Results View ---
  renderAIResultsView(result) {
    const res = result || {
      productName: 'Smart Helmet Shell',
      productType: 'Consumer Electronics',
      recommendedMaterial: { name: 'ABS Plastic', category: 'Plastics', strength: 45, density: 1.05, costDisplay: 'Low' },
      recommendedProcess: { name: 'Injection Molding', category: 'Molding', leadTime: '2-4 Weeks' },
      costBreakdown: { materialCost: 180, manufacturingCost: 240, assemblyCost: 60, totalPerUnit: 480, costRangeDisplay: '₹420 - ₹540' },
      scores: { overallScore: 9.4, strengthScore: 88, costScore: 95, sustainabilityScore: 82, manufacturabilityScore: 94, efficiency: 92 },
      explanations: {
        selectionReason: 'ABS Plastic delivers ideal impact strength-to-weight ratio for personal safety equipment.',
        advantages: ['High impact resistance', 'Excellent injection moldability', 'Cost-effective at batch scale'],
        limitations: ['Requires UV stabilizer coating for prolonged direct sunlight'],
        processExplanation: 'Injection Molding offers minimal cycle time per part at 5,000 batch volume.',
        productionBenefits: ['High dimensional repeatability', 'Minimal per-unit labor cost']
      }
    };

    return `
      <div class="mobile-card" style="border: 1px solid var(--accent-cyan);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span class="m-badge m-badge-cyan">AI Evaluation Complete</span>
            <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin-top: 4px;">${res.productName}</h2>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-cyan);">${res.scores.overallScore}/10</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">AI DFM Score</div>
          </div>
        </div>
      </div>

      <!-- Recommendation Summary Grid -->
      <div class="mobile-card">
        <h3 style="font-size: 0.95rem; color: var(--accent-cyan); margin-bottom: 10px;">🏆 Recommended Solution</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">RECOMMENDED MATERIAL</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--accent-cyan);">${res.recommendedMaterial.name}</div>
          </div>
          <div style="padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">MANUFACTURING PROCESS</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--accent-emerald);">${res.recommendedProcess.name}</div>
          </div>
          <div style="padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">ESTIMATED UNIT COST</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--accent-amber);">${res.costBreakdown.costRangeDisplay}</div>
          </div>
        </div>
      </div>

      <!-- DFM Explanation & Advantages -->
      <div class="mobile-card">
        <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">💡 AI Selection Logic</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">${res.explanations.selectionReason}</p>
        <div style="font-size: 0.8rem; font-weight: 600; color: var(--accent-emerald); margin-bottom: 6px;">Key Advantages:</div>
        <ul style="font-size: 0.8rem; color: var(--text-main); list-style: none; display: flex; flex-direction: column; gap: 4px;">
          ${res.explanations.advantages.map(a => `<li><i data-lucide="check-circle" style="width: 14px; color: var(--accent-emerald);"></i> ${a}</li>`).join('')}
        </ul>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 16px;">
        <button class="m-btn m-btn-primary" style="flex: 1;" onclick="window.mobileApp.switchTab('visualization')">
          <i data-lucide="box"></i> 2D / 3D CAD Preview
        </button>
        <button class="m-btn m-btn-outline" style="flex: 1;" onclick="window.mobileApp.exportPDFReport()">
          <i data-lucide="file-text"></i> Export PDF
        </button>
      </div>
    `;
  }

  // --- 5. Material Advisor View ---
  renderMaterialAdvisorView() {
    const dataMat = window.METHODWISE_DATA.MATERIALS;
    const allMats = [...dataMat.metals, ...dataMat.plastics, ...dataMat.composites];

    return `
      <div style="margin-bottom: 12px;">
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem;">Material Advisor</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted);">Explore mechanical properties, density, and cost benchmarks.</p>
      </div>

      <!-- Search Input -->
      <div class="mobile-form-group">
        <input type="text" id="m-mat-search" class="mobile-input" placeholder="Search metals, plastics, composites..." oninput="window.mobileApp.filterMaterials(this.value)">
      </div>

      <!-- Filter Pills -->
      <div class="mobile-filter-pills" id="m-mat-pills">
        <div class="m-pill active" onclick="window.mobileApp.selectMatPill('all', this)">All</div>
        <div class="m-pill" onclick="window.mobileApp.selectMatPill('Metals', this)">Metals</div>
        <div class="m-pill" onclick="window.mobileApp.selectMatPill('Plastics', this)">Plastics</div>
        <div class="m-pill" onclick="window.mobileApp.selectMatPill('Composites', this)">Composites</div>
      </div>

      <!-- Materials List -->
      <div id="m-mat-list" style="display: flex; flex-direction: column; gap: 12px;">
        ${allMats.map(m => `
          <div class="mobile-card" style="margin-bottom: 0;" onclick="window.mobileApp.openMaterialSheet('${m.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-cyan);">${m.name}</h3>
              <span class="m-badge m-badge-cyan">${m.category}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 12px; margin-bottom: 8px;">
              <span>Strength: <strong>${m.strength} MPa</strong></span>
              <span>Density: <strong>${m.density} g/cm³</strong></span>
            </div>
            <div style="font-size: 0.75rem; color: var(--accent-emerald); font-weight: 600;">${m.costDisplay}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 6. Manufacturing Advisor View ---
  renderMfgAdvisorView() {
    const processes = window.METHODWISE_DATA.PROCESSES || [];

    return `
      <div style="margin-bottom: 12px;">
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem;">Manufacturing Advisor</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted);">DFM rules, tolerances, tooling costs, and lead times.</p>
      </div>

      <div class="mobile-form-group">
        <input type="text" id="m-mfg-search" class="mobile-input" placeholder="Search CNC, Injection Molding, 3D Print..." oninput="window.mobileApp.filterMfg(this.value)">
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <button class="m-btn m-btn-outline" style="height: 36px; font-size: 0.8rem;" onclick="window.mobileApp.exportMfgCSV()">
          <i data-lucide="download"></i> Export CSV Analysis
        </button>
      </div>

      <div id="m-mfg-list" style="display: flex; flex-direction: column; gap: 12px;">
        ${processes.map(p => `
          <div class="mobile-card" style="margin-bottom: 0;" onclick="window.mobileApp.openMfgSheet('${p.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-emerald);">${p.name}</h3>
              <span class="m-badge m-badge-purple">${p.category || 'DFM'}</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.3; margin-bottom: 8px;">${p.description.slice(0, 90)}...</p>
            <div style="font-size: 0.74rem; color: var(--text-dim); display: flex; justify-content: space-between;">
              <span>Batch: <strong>${p.bestForQty}</strong></span>
              <span>Lead Time: <strong>${p.leadTime}</strong></span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 7. Cost Analysis View ---
  renderCostAnalysisView() {
    return `
      <div class="mobile-card">
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin-bottom: 4px;">Cost Analysis Engine</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">Interactive batch volume pricing & NRE tooling amortization.</p>

        <div class="mobile-form-group">
          <label class="mobile-label">Production Batch Volume</label>
          <input type="range" id="m-cost-slider" min="100" max="50000" step="100" value="5000" style="width: 100%; accent-color: var(--accent-cyan);" oninput="window.mobileApp.updateCostCalc(this.value)">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 6px;">
            <span style="color: var(--text-muted);">Batch Volume:</span>
            <span style="font-weight: 700; color: var(--accent-cyan);" id="m-cost-qty-disp">5,000 Units</span>
          </div>
        </div>

        <!-- Calculated Cost Card -->
        <div style="background: var(--bg-input); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 16px; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">ESTIMATED UNIT COST</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-emerald);" id="m-cost-unit-price">₹480 / unit</div>
          <div style="font-size: 0.78rem; color: var(--text-dim);" id="m-cost-total-batch">Total Batch: ₹24,00,000</div>
        </div>

        <!-- Cost Breakdown Table -->
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px;">
            <span>Raw Material</span>
            <strong id="m-cost-mat">₹180 (38%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px;">
            <span>Manufacturing Operating</span>
            <strong id="m-cost-mfg">₹240 (50%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px;">
            <span>Tooling Amortization (NRE)</span>
            <strong id="m-cost-tool">₹50 (10%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px;">
            <span>Inspection & Packaging</span>
            <strong id="m-cost-insp">₹10 (2%)</strong>
          </div>
        </div>

        <button class="m-btn m-btn-primary" onclick="window.mobileApp.exportPDFReport()">
          <i data-lucide="file-text"></i> Download PDF Cost Breakdown
        </button>
      </div>
    `;
  }

  // --- 8. 2D / 3D Product Visualization View ---
  renderVisualizationView() {
    return `
      <div class="mobile-card">
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin-bottom: 4px;">3D CAD & 2D Blueprint</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">Touch gesture 3D preview and CAD drawing visualizer.</p>

        <!-- View Mode Switcher -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <button class="m-btn m-btn-primary" id="m-viz-3d-btn" style="flex: 1; height: 36px; font-size: 0.8rem;" onclick="window.mobileApp.toggleVizMode('3d')">3D WebGL Model</button>
          <button class="m-btn m-btn-outline" id="m-viz-2d-btn" style="flex: 1; height: 36px; font-size: 0.8rem;" onclick="window.mobileApp.toggleVizMode('2d')">2D Technical Blueprint</button>
        </div>

        <!-- 3D Canvas Box -->
        <div id="m-3d-box" style="width: 100%; height: 260px; background: #040711; border-radius: var(--radius-sm); border: 1px solid var(--border-color); position: relative;">
          <div id="mobile-3d-canvas-container" style="width: 100%; height: 100%;"></div>
          <div style="position: absolute; bottom: 8px; right: 8px; display: flex; gap: 6px;">
            <button class="icon-btn" style="width: 32px; height: 32px;" title="Reset Camera" onclick="if(window.mobileApp.viewer3D) window.mobileApp.viewer3D.resetView();"><i data-lucide="rotate-ccw" style="width: 16px;"></i></button>
            <button class="icon-btn" style="width: 32px; height: 32px;" title="Wireframe" onclick="if(window.mobileApp.viewer3D) window.mobileApp.viewer3D.toggleWireframe();"><i data-lucide="grid" style="width: 16px;"></i></button>
          </div>
        </div>

        <!-- 2D Canvas Box (Hidden by default) -->
        <div id="m-2d-box" style="width: 100%; height: 260px; background: #040711; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: none; position: relative;">
          <div id="mobile-2d-canvas-container" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    `;
  }

  // --- 9. Design History View ---
  renderHistoryView() {
    const projects = window.MethodWiseSync.getProjects();

    return `
      <div style="margin-bottom: 12px;">
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem;">Previous Design History</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted);">Synchronized across Web and Android Mobile App.</p>
      </div>

      <div class="mobile-form-group">
        <input type="text" id="m-hist-search" class="mobile-input" placeholder="Search saved projects..." oninput="window.mobileApp.filterHistory(this.value)">
      </div>

      <div id="m-hist-list" style="display: flex; flex-direction: column; gap: 12px;">
        ${projects.length === 0 ? '<div class="mobile-card">No saved projects found.</div>' : projects.map(p => `
          <div class="mobile-card" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <div>
                <span class="m-badge m-badge-cyan" style="font-size: 0.68rem;">${p.type || 'Product'}</span>
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-top: 4px;">${p.name}</h3>
              </div>
              <span class="m-badge m-badge-emerald">Score ${p.score || 9}/10</span>
            </div>
            
            <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 2px; margin-bottom: 10px;">
              <div>Material: <strong>${p.material}</strong></div>
              <div>Process: <strong>${p.process}</strong></div>
              <div>Unit Cost: <strong style="color: var(--accent-amber);">${p.costRange || ('₹' + p.unitCost)}</strong></div>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="m-btn m-btn-outline" style="flex: 1; height: 36px; font-size: 0.8rem;" onclick="window.mobileApp.viewHistoryDetail('${p.id}')">
                <i data-lucide="eye"></i> View Report
              </button>
              <button class="m-btn m-btn-danger" style="width: 44px; height: 36px;" onclick="window.mobileApp.deleteProject('${p.id}')">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 10. Settings View ---
  renderSettingsView() {
    const settings = window.MethodWiseSync.getSettings();
    const session = window.MethodWiseSync.getAuthSession();

    return `
      <div class="mobile-card">
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin-bottom: 4px;">Profile & App Settings</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">Account synchronization & app preferences.</p>

        <!-- User Profile Card -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-input); border-radius: var(--radius-sm); margin-bottom: 20px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 1.2rem;">
            MW
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem;">${session.user ? session.user.name : 'Engineering Lead'}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${session.user ? session.user.email : 'engineer@methodwise.ai'}</div>
            <span class="m-badge m-badge-emerald" style="margin-top: 4px;">Account Synchronized</span>
          </div>
        </div>

        <!-- Preferences Toggles -->
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.9rem; font-weight: 600;">Theme Appearance</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Switch between Dark and Light Mode</div>
            </div>
            <button class="m-btn m-btn-outline" style="width: 100px; height: 34px; font-size: 0.78rem;" id="m-theme-toggle-btn" onclick="window.mobileApp.toggleTheme()">
              ${settings.theme === 'light' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.9rem; font-weight: 600;">Push Notifications</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Receive AI evaluation & cost alerts</div>
            </div>
            <input type="checkbox" ${settings.pushNotifications ? 'checked' : ''} onchange="window.mobileApp.updateSettings({ pushNotifications: this.checked })">
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.9rem; font-weight: 600;">Auto-Sync Projects</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Bi-directional web-mobile sync</div>
            </div>
            <input type="checkbox" checked disabled>
          </div>
        </div>

        <button class="m-btn m-btn-danger" onclick="window.mobileApp.logout()">
          <i data-lucide="log-out"></i> Logout Account
        </button>
      </div>
    `;
  }
}

window.MobileUIComponents = MobileUIComponents;
