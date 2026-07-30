/**
 * MethodWise AI - Interactive 2D Technical CAD Blueprint Visualizer
 * Renders dynamic 2D engineering drawings, orthographic projections (Front, Top, Section Cut),
 * custom geometry shapes (Shafts, Gears, Enclosures, Drone Frames, Plates, Joints),
 * dimension leader arrows, wall thickness callouts, and tolerance annotations on HTML5 Canvas.
 */

class CAD2DViewer {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!this.container) return;

    this.options = Object.assign({
      viewMode: 'front', // 'front', 'top', 'section'
      showGrid: true,
      length: 280,
      width: 220,
      height: 180,
      unit: 'mm',
      productName: 'Smart Product',
      productType: 'Consumer Product',
      shapeType: 'auto'
    }, options);

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.render();
  }

  resizeCanvas() {
    if (!this.container || !this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = rect.height || 360;
    this.render();
  }

  setViewMode(mode) {
    this.options.viewMode = mode;
    this.render();
  }

  detectShape(name = '', type = '') {
    const str = `${name} ${type}`.toLowerCase();
    if (str.includes('medical') || str.includes('syringe') || str.includes('pump') || str.includes('shaft') || str.includes('cylinder')) return 'medical';
    if (str.includes('drone') || str.includes('frame') || str.includes('quadcopter') || str.includes('robotics')) return 'drone';
    if (str.includes('thermal') || str.includes('plate') || str.includes('heat') || str.includes('battery') || str.includes('bracket')) return 'thermal';
    if (str.includes('impeller') || str.includes('turbine') || str.includes('gear') || str.includes('rotor')) return 'impeller';
    if (str.includes('robot') || str.includes('joint') || str.includes('casing') || str.includes('arm')) return 'robot';
    return 'helmet'; // Enclosure / Housing default
  }

  updateDimensions(l, w, h, unit = 'mm', name, type) {
    if (l) this.options.length = l;
    if (w) this.options.width = w;
    if (h) this.options.height = h;
    if (unit) this.options.unit = unit;
    if (name) this.options.productName = name;
    if (type) this.options.productType = type;
    this.render();
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Dark Blueprint Background
    this.ctx.fillStyle = '#050a14';
    this.ctx.fillRect(0, 0, w, h);

    // 2. Blueprint Grid Lines
    if (this.options.showGrid) {
      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
      this.ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < w; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, h);
        this.ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(w, y);
        this.ctx.stroke();
      }
    }

    // 3. Technical Title Block (Bottom Right)
    this.drawTitleBlock(w, h);

    // 4. Render Orthographic 2D Views based on Shape Type
    const shape = this.options.shapeType === 'auto' || !this.options.shapeType ? 
                  this.detectShape(this.options.productName, this.options.productType) : 
                  this.options.shapeType;

    const centerX = w / 2;
    const centerY = h / 2 - 10;
    const scale = Math.min(w / 600, h / 400);

    const len = Math.max(120, Math.min(260, this.options.length * 0.8 * scale));
    const hei = Math.max(80, Math.min(180, this.options.height * 0.8 * scale));
    const wid = Math.max(80, Math.min(180, this.options.width * 0.8 * scale));

    if (shape === 'medical') {
      this.drawCylindricalShaftView(centerX, centerY, len, hei, '#10b981');
    } else if (shape === 'drone') {
      this.drawDroneFrameView(centerX, centerY, len, wid, '#f59e0b');
    } else if (shape === 'thermal') {
      this.drawThermalPlateView(centerX, centerY, len, hei, '#3b82f6');
    } else if (shape === 'impeller') {
      this.drawGearImpellerView(centerX, centerY, Math.min(len, hei), '#c084fc');
    } else if (shape === 'robot') {
      this.drawRoboticJointView(centerX, centerY, len, hei, '#f43f5e');
    } else {
      this.drawEnclosureView(centerX, centerY, len, hei, '#00f2fe');
    }
  }

  // --- 1. Enclosure / Helmet View (Cyan Theme) ---
  drawEnclosureView(cx, cy, width, height, color) {
    const ctx = this.ctx;
    const x = cx - width / 2;
    const y = cy - height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0, 242, 254, 0.06)';
    
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + height * 0.4);
    ctx.quadraticCurveTo(x, y, x + width * 0.3, y);
    ctx.lineTo(x + width * 0.7, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + height * 0.4);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x + width * 0.2, y + height * 0.3, width * 0.15, height * 0.5);
    ctx.strokeRect(x + width * 0.65, y + height * 0.3, width * 0.15, height * 0.5);
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, y - 20); ctx.lineTo(cx, y + height + 20); ctx.stroke();

    this.drawDimensionHorizontal(x, y + height + 30, width, `${this.options.length} ${this.options.unit} (L)`);
    this.drawDimensionVertical(x - 30, y, height, `${this.options.height} ${this.options.unit} (H)`);
    this.drawCallout(x + width * 0.7, y + height * 0.2, x + width + 40, y - 10, 'Wall t = 2.5 mm');
  }

  // --- 2. Cylindrical Shaft / Medical View (Emerald Theme) ---
  drawCylindricalShaftView(cx, cy, width, height, color) {
    const ctx = this.ctx;
    const x = cx - width / 2;
    const y = cy - height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';

    // Step-down Shaft Cylindrical Profile
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.2);
    ctx.lineTo(x + width * 0.3, y + height * 0.2);
    ctx.lineTo(x + width * 0.3, y + height * 0.05);
    ctx.lineTo(x + width * 0.8, y + height * 0.05);
    ctx.lineTo(x + width, y + height * 0.35);
    ctx.lineTo(x + width, y + height * 0.65);
    ctx.lineTo(x + width * 0.8, y + height * 0.95);
    ctx.lineTo(x + width * 0.3, y + height * 0.95);
    ctx.lineTo(x + width * 0.3, y + height * 0.8);
    ctx.lineTo(x, y + height * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Centerline Axis
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4, 2, 4]);
    ctx.beginPath(); ctx.moveTo(x - 20, cy); ctx.lineTo(x + width + 20, cy); ctx.stroke();
    ctx.setLineDash([]);

    this.drawDimensionHorizontal(x, y + height + 25, width, `Ø ${this.options.length} ${this.options.unit} (Shaft Length)`);
    this.drawDimensionVertical(x - 30, y + height * 0.05, height * 0.9, `Ø ${this.options.height} ${this.options.unit} (Dia)`);
    this.drawCallout(x + width * 0.5, y + height * 0.1, x + width * 0.5, y - 25, 'Concentricity Tolerance 0.02 mm');
  }

  // --- 3. Drone Quadcopter Frame View (Gold Theme) ---
  drawDroneFrameView(cx, cy, width, height, color) {
    const ctx = this.ctx;
    const r = Math.min(width, height) * 0.45;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';

    // Center Hub
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 4 Arms
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const ax = cx + Math.cos(angle) * r;
      const ay = cy + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // Motor Pod Circle
      ctx.beginPath(); ctx.arc(ax, ay, r * 0.2, 0, Math.PI * 2); ctx.stroke();
    }

    this.drawDimensionHorizontal(cx - r, cy + r + 25, r * 2, `${this.options.length} ${this.options.unit} (Wheelbase)`);
    this.drawCallout(cx, cy - r * 0.35, cx + r + 20, cy - r, 'Center Mass Cutout Ø 45mm');
  }

  // --- 4. Thermal Cooling Plate View (Blue Theme) ---
  drawThermalPlateView(cx, cy, width, height, color) {
    const ctx = this.ctx;
    const x = cx - width / 2;
    const y = cy - height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';

    // Rectangular Plate
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Heat Fins / Channels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    const finSpacing = width / 6;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * finSpacing, y + 15);
      ctx.lineTo(x + i * finSpacing, y + height - 15);
      ctx.stroke();
    }

    // 4 Mounting Corner Holes
    [ [x + 15, y + 15], [x + width - 15, y + 15], [x + 15, y + height - 15], [x + width - 15, y + height - 15] ].forEach(([hx, hy]) => {
      ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.stroke();
    });

    this.drawDimensionHorizontal(x, y + height + 25, width, `${this.options.length} ${this.options.unit}`);
    this.drawDimensionVertical(x - 30, y, height, `${this.options.height} ${this.options.unit}`);
    this.drawCallout(x + width - 15, y + 15, x + width + 30, y - 20, '4x M6 Threaded Holes');
  }

  // --- 5. Gear / Impeller View (Purple Theme) ---
  drawGearImpellerView(cx, cy, radius, color) {
    const ctx = this.ctx;
    const r = radius * 0.45;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(192, 132, 252, 0.08)';

    // Outer Pitch Circle
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Center Bore Hole
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.stroke();

    // 12 Gear Teeth
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const tx1 = cx + Math.cos(angle) * r;
      const ty1 = cy + Math.sin(angle) * r;
      const tx2 = cx + Math.cos(angle) * (r + 14);
      const ty2 = cy + Math.sin(angle) * (r + 14);

      ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke();
    }

    this.drawDimensionHorizontal(cx - r, cy + r + 25, r * 2, `Pitch Dia Ø ${this.options.length} ${this.options.unit}`);
    this.drawCallout(cx, cy - r * 0.3, cx + r + 30, cy - r - 10, 'Bore Fit H7 Tolerance');
  }

  // --- 6. Robotic Joint View (Coral Theme) ---
  drawRoboticJointView(cx, cy, width, height, color) {
    const ctx = this.ctx;
    const x = cx - width / 2;
    const y = cy - height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(244, 63, 94, 0.08)';

    // L-Bracket Link
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * 0.4, y);
    ctx.lineTo(x + width * 0.4, y + height * 0.6);
    ctx.lineTo(x + width, y + height * 0.6);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pivot Bearing Hole
    ctx.beginPath(); ctx.arc(x + width * 0.2, y + height * 0.3, 14, 0, Math.PI * 2); ctx.stroke();

    this.drawDimensionHorizontal(x, y + height + 25, width, `${this.options.length} ${this.options.unit} (Linkage Length)`);
    this.drawDimensionVertical(x - 30, y, height, `${this.options.height} ${this.options.unit} (Offset)`);
    this.drawCallout(x + width * 0.2, y + height * 0.3, x - 40, y - 20, 'Pivot Bearing Seat Ø 28mm');
  }

  // --- Title Block ---
  drawTitleBlock(w, h) {
    const ctx = this.ctx;
    const bw = 240;
    const bh = 55;
    const bx = w - bw - 10;
    const by = h - bh - 10;

    ctx.fillStyle = 'rgba(8, 13, 26, 0.85)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(this.options.productName.toUpperCase(), bx + 10, by + 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`METHODWISE AI | 2D TECHNICAL BLUEPRINT`, bx + 10, by + 34);
    ctx.fillText(`VIEW: ${this.options.viewMode.toUpperCase()} | SCALE 1:1 (${this.options.unit.toUpperCase()})`, bx + 10, by + 48);
  }

  // --- Dimension Helpers ---
  drawDimensionHorizontal(x, y, width, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
    ctx.moveTo(x + width, y - 6); ctx.lineTo(x + width, y + 6);
    ctx.moveTo(x, y); ctx.lineTo(x + width, y);
    ctx.stroke();

    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y - 4);
    ctx.textAlign = 'left';
  }

  drawDimensionVertical(x, y, height, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
    ctx.moveTo(x - 6, y + height); ctx.lineTo(x + 6, y + height);
    ctx.moveTo(x, y); ctx.lineTo(x, y + height);
    ctx.stroke();

    ctx.save();
    ctx.translate(x - 8, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  drawCallout(x1, y1, x2, y2, text) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(x1, y1, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(text, x2 + (x2 > x1 ? 4 : -70), y2 + 4);
  }
}

window.CAD2DViewer = CAD2DViewer;
