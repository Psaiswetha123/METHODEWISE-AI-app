/**
 * MethodWise AI - Multi-Step Product Design Form Controller
 * Captures custom product name, geometry, materials, and manufacturing requirements.
 */

class WizardController {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.state = {
      productName: 'Smart Helmet X-1',
      productType: 'Consumer Product',
      description: 'Aerodynamic smart protective helmet with Bluetooth & telemetry.',
      purpose: 'High impact protection for urban commuting & cycling.',
      targetUsage: 'Outdoor High Shock & Impact',
      length: 280,
      width: 220,
      height: 180,
      weight: 850,
      unit: 'mm',
      preferredMaterials: ['abs-plastic'],
      manufacturingProcess: 'injection-molding',
      quantity: 5000,
      accuracy: '± 0.05 mm',
      surfaceFinish: 'Ra 1.6 µm (Smooth finish)',
      durabilityLevel: 'High Impact',
      budgetRange: 'medium',
      customMinCost: 500,
      customMaxCost: 5000
    };

    this.step2Viewer = null;
  }

  init() {
    this.bindEvents();
    this.renderMaterialsStep3();
    this.updateStepUI();
  }

  bindEvents() {
    // Navigation buttons
    const btnNext = document.getElementById('wizard-btn-next');
    const btnPrev = document.getElementById('wizard-btn-prev');
    const btnSubmit = document.getElementById('wizard-btn-submit');

    if (btnNext) btnNext.addEventListener('click', () => this.nextStep());
    if (btnPrev) btnPrev.addEventListener('click', () => this.prevStep());
    if (btnSubmit) btnSubmit.addEventListener('click', () => this.submitWizard());

    // Step 2 Dimension inputs live updates
    ['dim-length', 'dim-width', 'dim-height', 'dim-weight'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.onDimensionChange());
      }
    });

    const unitSelect = document.getElementById('dim-unit');
    if (unitSelect) {
      unitSelect.addEventListener('change', () => this.onDimensionChange());
    }

    // Preset example quick loaders
    const btnHelmet = document.getElementById('load-sample-helmet');
    if (btnHelmet) {
      btnHelmet.addEventListener('click', () => this.loadPreset('helmet'));
    }

    const btnMedical = document.getElementById('load-sample-medical');
    if (btnMedical) {
      btnMedical.addEventListener('click', () => this.loadPreset('medical'));
    }
  }

  updateStepUI() {
    // Hide all step panels, show current
    for (let i = 1; i <= this.totalSteps; i++) {
      const panel = document.getElementById(`wizard-step-${i}`);
      const indicator = document.getElementById(`step-indicator-${i}`);
      if (panel) {
        if (i === this.currentStep) {
          panel.classList.add('active');
          panel.classList.remove('hidden');
        } else {
          panel.classList.remove('active');
          panel.classList.add('hidden');
        }
      }

      if (indicator) {
        if (i === this.currentStep) {
          indicator.classList.add('active');
          indicator.classList.remove('completed');
        } else if (i < this.currentStep) {
          indicator.classList.remove('active');
          indicator.classList.add('completed');
        } else {
          indicator.classList.remove('active', 'completed');
        }
      }
    }

    // Step navigation buttons visibility
    const btnPrev = document.getElementById('wizard-btn-prev');
    const btnNext = document.getElementById('wizard-btn-next');
    const btnSubmit = document.getElementById('wizard-btn-submit');

    if (btnPrev) btnPrev.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
    if (btnNext) btnNext.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-flex';
    if (btnSubmit) btnSubmit.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';

    // Special init for Step 2 (3D Dimension Visualizer Canvas)
    if (this.currentStep === 2) {
      setTimeout(() => {
        if (!this.step2Viewer && window.CAD3DViewer) {
          this.step2Viewer = new window.CAD3DViewer('step2-3d-canvas-container', {
            autoRotate: true,
            materialStyle: 'plastic'
          });
        }
        this.onDimensionChange();
      }, 100);
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.collectStepData(this.currentStep);
      this.currentStep++;
      this.updateStepUI();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepUI();
    }
  }

  goToStep(stepNum) {
    if (stepNum >= 1 && stepNum <= this.totalSteps) {
      this.currentStep = stepNum;
      this.updateStepUI();
    }
  }

  collectAllData() {
    const nameVal = document.getElementById('prod-name')?.value?.trim();
    if (nameVal) this.state.productName = nameVal;

    const typeVal = document.getElementById('prod-type')?.value;
    if (typeVal) this.state.productType = typeVal;

    this.state.description = document.getElementById('prod-desc')?.value || '';
    this.state.purpose = document.getElementById('prod-purpose')?.value || '';
    this.state.targetUsage = document.getElementById('prod-usage')?.value || '';

    this.state.length = parseFloat(document.getElementById('dim-length')?.value) || 100;
    this.state.width = parseFloat(document.getElementById('dim-width')?.value) || 100;
    this.state.height = parseFloat(document.getElementById('dim-height')?.value) || 50;
    this.state.weight = parseFloat(document.getElementById('dim-weight')?.value) || 500;
    this.state.unit = document.getElementById('dim-unit')?.value || 'mm';

    this.state.manufacturingProcess = document.getElementById('mfg-process-select')?.value || 'auto';
    this.state.quantity = parseInt(document.getElementById('mfg-qty')?.value) || 1000;
    this.state.accuracy = document.getElementById('mfg-accuracy')?.value || '±0.05 mm';
    this.state.surfaceFinish = document.getElementById('mfg-surface')?.value || 'Standard';
    this.state.durabilityLevel = document.getElementById('mfg-durability')?.value || 'High';

    const budgetRadio = document.querySelector('input[name="budget-tier"]:checked');
    if (budgetRadio) this.state.budgetRange = budgetRadio.value;
  }

  collectStepData(step) {
    this.collectAllData();
  }

  onDimensionChange() {
    const l = parseFloat(document.getElementById('dim-length')?.value) || 100;
    const w = parseFloat(document.getElementById('dim-width')?.value) || 100;
    const h = parseFloat(document.getElementById('dim-height')?.value) || 50;
    const unit = document.getElementById('dim-unit')?.value || 'mm';

    if (this.step2Viewer) {
      this.step2Viewer.updateDimensions(l, w, h, unit);
    }
  }

  renderMaterialsStep3(filterCat = 'all') {
    const container = document.getElementById('materials-grid-container');
    if (!container) return;

    const data = window.METHODWISE_DATA.MATERIALS;
    let list = [];
    if (filterCat === 'all' || filterCat === 'Metals') list.push(...data.metals);
    if (filterCat === 'all' || filterCat === 'Plastics') list.push(...data.plastics);
    if (filterCat === 'all' || filterCat === 'Composites') list.push(...data.composites);

    container.innerHTML = list.map(m => {
      const isSelected = this.state.preferredMaterials.includes(m.id);
      return `
        <div class="material-card ${isSelected ? 'selected' : ''}" onclick="window.wizard.toggleMaterial('${m.id}')" id="mat-card-${m.id}">
          <div class="material-card-header">
            <span class="material-cat-badge badge-${m.category.toLowerCase()}">${m.category}</span>
            <span class="material-check-icon"><i data-lucide="${isSelected ? 'check-circle-2' : 'circle'}"></i></span>
          </div>
          <h4 class="material-name">${m.name}</h4>
          <p class="material-cost-tag">${m.costDisplay}</p>
          <div class="material-specs-mini">
            <div class="spec-row"><span>Tensile Strength:</span> <strong>${m.strength} MPa</strong></div>
            <div class="spec-row"><span>Density / Weight:</span> <strong>${m.density} g/cm³ (${m.weightRating})</strong></div>
            <div class="spec-row"><span>Durability Rating:</span> <strong>${m.durability}%</strong></div>
            <div class="spec-row"><span>Temp Resistance:</span> <strong>${m.tempResistance}°C</strong></div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  filterMaterials(category) {
    document.querySelectorAll('.mat-cat-tab').forEach(tab => tab.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    this.renderMaterialsStep3(category);
  }

  toggleMaterial(matId) {
    if (this.state.preferredMaterials.includes(matId)) {
      this.state.preferredMaterials = this.state.preferredMaterials.filter(id => id !== matId);
    } else {
      this.state.preferredMaterials = [matId];
    }
    this.renderMaterialsStep3();
  }

  loadPreset(type) {
    if (type === 'helmet') {
      document.getElementById('prod-name').value = 'Smart Helmet X-1';
      document.getElementById('prod-type').value = 'Consumer Product';
      document.getElementById('prod-desc').value = 'Aerodynamic smart protective helmet with Bluetooth & LED telemetry.';
      document.getElementById('prod-purpose').value = 'High impact protection for urban commuting & cycling.';
      document.getElementById('prod-usage').value = 'Outdoor Weather, Shock & Vibration';
      document.getElementById('dim-length').value = 280;
      document.getElementById('dim-width').value = 220;
      document.getElementById('dim-height').value = 180;
      document.getElementById('dim-weight').value = 850;
      this.state.preferredMaterials = ['abs-plastic'];
      this.state.manufacturingProcess = 'injection-molding';
      this.state.quantity = 5000;
    } else if (type === 'medical') {
      document.getElementById('prod-name').value = 'MediPump Titanium Enclosure';
      document.getElementById('prod-type').value = 'Medical Equipment';
      document.getElementById('prod-desc').value = 'Sterile biocompatible enclosure for hospital infusion system.';
      document.getElementById('prod-purpose').value = 'Corrosion resistant housing for precision surgical fluid pump.';
      document.getElementById('prod-usage').value = 'Sterile Medical Environment, High Precision';
      document.getElementById('dim-length').value = 160;
      document.getElementById('dim-width').value = 110;
      document.getElementById('dim-height').value = 90;
      document.getElementById('dim-weight').value = 450;
      this.state.preferredMaterials = ['titanium-ti6al4v'];
      this.state.manufacturingProcess = 'cnc-machining';
      this.state.quantity = 250;
    }
    this.collectAllData();
    this.onDimensionChange();
    this.renderMaterialsStep3();
    if (window.app) window.app.showToast('Loaded sample project preset data!', 'success');
  }

  submitWizard() {
    this.collectAllData();

    // Show loading overlay animation
    const overlay = document.getElementById('ai-thinking-overlay');
    if (overlay) overlay.classList.remove('hidden');

    setTimeout(() => {
      // Run AI evaluation algorithm with user's exact custom product name & inputs
      const result = window.aiEngine.evaluate(this.state);
      
      if (overlay) overlay.classList.add('hidden');

      // Pass result to main app to render AI Analysis Result Page!
      if (window.app) {
        window.app.displayAIResults(result);
        window.app.showToast(`Analysis completed for ${result.productName}`, 'success');
      }
    }, 1800);
  }
}

window.WizardController = WizardController;
