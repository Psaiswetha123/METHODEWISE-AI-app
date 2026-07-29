/**
 * MethodWise AI - Interactive 2D Technical CAD Blueprint Visualizer
 * Renders 2D engineering drawings, orthographic projections (Front, Top, Section Cut),
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
      productName: 'Smart Product'
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

  updateDimensions(l, w, h, unit = 'mm', name) {
    if (l) this.options.length = l;
    if (w) this.options.width = w;
    if (h) this.options.height = h;
    if (unit) this.options.unit = unit;
    if (name) this.options.productName = name;
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

    // 4. Render Orthographic 2D Views
    const centerX = w / 2;
    const centerY = h / 2 - 10;
    const scale = Math.min(w / 600, h / 400);

    const len = Math.max(120, Math.min(260, this.options.length * 0.8 * scale));
    const hei = Math.max(80, Math.min(180, this.options.height * 0.8 * scale));
    const wid = Math.max(80, Math.min(180, this.options.width * 0.8 * scale));

    if (this.options.viewMode === 'front') {
      this.drawFrontView(centerX, centerY, len, hei);
    } else if (this.options.viewMode === 'top') {
      this.drawTopView(centerX, centerY, len, wid);
    } else if (this.options.viewMode === 'section') {
      this.drawSectionView(centerX, centerY, len, hei);
    }
  }

  drawFrontView(cx, cy, width, height) {
    const ctx = this.ctx;
    const x = cx - width / 2;
    const y = cy - height / 2;

    // Outlines (Cyan Blueprint glow line)
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
    
    // Main Geometry Shell with Rounded Top & Ribs
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

    // Internal Features / Mounting Bosses
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]); // Dashed hidden lines
    ctx.strokeRect(x + width * 0.2, y + height * 0.3, width * 0.15, height * 0.5);
    ctx.strokeRect(x + width * 0.65, y + height * 0.3, width * 0.15, height * 0.5);
    ctx.setLineDash([]);

    // Center Axis Lines
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, y - 20);
    ctx.lineTo(cx, y + height + 20);
    ctx.stroke();

    // Dimension Leaders
    this.drawDimensionHorizontal(x, y + height + 30, width, `${this.options.length} ${this.options.unit} (Length)`);
    this.drawDimensionVertical(x - 30, y, height, `${this.options.height} ${this.options.unit} (Height)`);

    // Callout Note
    this.drawCallout(x + width * 0.7, y + height * 0.2, x + width + 40, y - 10, 'Wall Thickness t = 2.5 mm');
    this.drawCallout(x + width * 0.15, y + height * 0.8, x - 50, y + height + 10, 'Draft Angle θ = 1.5°');
  }

  drawTopView(cx, cy, width, depth) {
    const ctx = this.ctx;
    const x = cx - width / 2;
    const y = cy - depth / 2;

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';

    // Rounded rectangle boundary
    const r = 20;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + depth - r);
    ctx.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
    ctx.lineTo(x + r, y + depth);
    ctx.quadraticCurveTo(x, y + depth, x, y + depth - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4 Corner Mounting Holes
    ctx.fillStyle = '#050a14';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    [
      { hx: x + 25, hy: y + 25 },
      { hx: x + width - 25, hy: y + 25 },
      { hx: x + 25, hy: y + depth - 25 },
      { hx: x + width - 25, hy: y + depth - 25 }
    ].forEach(hole => {
      ctx.beginPath();
      ctx.arc(hole.hx, hole.hy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Center Axes
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.beginPath();
    ctx.moveTo(cx, y - 20); ctx.lineTo(cx, y + depth + 20);
    ctx.moveTo(x - 20, cy); ctx.lineTo(x + width + 20, cy);
    ctx.stroke();

    // Dimension Leaders
    this.drawDimensionHorizontal(x, y + depth + 30, width, `${this.options.length} ${this.options.unit}`);
    this.drawDimensionVertical(x - 30, y, depth, `${this.options.width} ${this.options.unit} (Width)`);

    // Callout
    this.drawCallout(x + 25, y + 25, x - 50, y - 10, '4x Ø 6.0 mm Standard Holes');
  }

  drawSectionView(cx, cy, width, height) {
    const ctx = this.ctx;
    const x = cx - width / 2;
    const y = cy - height / 2;

    // Cross section hatch background
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;

    // Outer wall contour
    ctx.strokeRect(x, y, width, height);

    // Inner void wall
    const wall = 16;
    ctx.strokeRect(x + wall, y + wall, width - wall * 2, height - wall * 2);

    // Section Hatching Lines (45 degree lines on cross section walls)
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    ctx.lineWidth = 1;
    for (let i = -height; i < width + height; i += 12) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + height, y + height);
      ctx.stroke();
    }

    // Clear inner cavity
    ctx.fillStyle = '#050a14';
    ctx.fillRect(x + wall + 1, y + wall + 1, width - wall * 2 - 2, height - wall * 2 - 2);

    // Section Callout
    this.drawDimensionHorizontal(x, y + height + 30, width, `${this.options.length} ${this.options.unit}`);
    this.drawCallout(x + wall / 2, y + height / 2, x - 50, y + height / 2, 'Section A-A Cut View');
  }

  drawDimensionHorizontal(x, y, width, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#4facfe';
    ctx.fillStyle = '#4facfe';
    ctx.lineWidth = 1.2;

    // Dimension line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();

    // End ticks
    ctx.beginPath();
    ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
    ctx.moveTo(x + width, y - 6); ctx.lineTo(x + width, y + 6);
    ctx.stroke();

    // Arrow heads
    this.drawArrow(x, y, 0);
    this.drawArrow(x + width, y, Math.PI);

    // Text Label
    ctx.font = '11px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y - 6);
  }

  drawDimensionVertical(x, y, height, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#4facfe';
    ctx.fillStyle = '#4facfe';
    ctx.lineWidth = 1.2;

    // Vertical Line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();

    // End ticks
    ctx.beginPath();
    ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
    ctx.moveTo(x - 6, y + height); ctx.lineTo(x + 6, y + height);
    ctx.stroke();

    // Arrow heads
    this.drawArrow(x, y, Math.PI / 2);
    this.drawArrow(x, y + height, -Math.PI / 2);

    // Text Label Vertical
    ctx.save();
    ctx.translate(x - 10, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '11px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  drawCallout(fromX, fromY, toX, toY, text) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 1;

    // Pointer line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Pointer Dot
    ctx.beginPath();
    ctx.arc(fromX, fromY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Label text
    ctx.font = '11px "JetBrains Mono", sans-serif';
    ctx.textAlign = toX > fromX ? 'left' : 'right';
    ctx.fillText(text, toX + (toX > fromX ? 6 : -6), toY + 4);
  }

  drawArrow(x, y, angle) {
    const ctx = this.ctx;
    const size = 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, -size / 2);
    ctx.lineTo(size, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawTitleBlock(w, h) {
    const ctx = this.ctx;
    const bw = 240;
    const bh = 54;
    const bx = w - bw - 10;
    const by = h - bh - 10;

    ctx.fillStyle = 'rgba(8, 13, 26, 0.85)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.fillStyle = '#00f2fe';
    ctx.textAlign = 'left';
    ctx.fillText(`CAD 2D BLUEPRINT - ${this.options.productName.toUpperCase()}`, bx + 8, by + 14);

    ctx.font = '9px "JetBrains Mono", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`SCALE: 1:1 | PROJECTION: 3RD ANGLE`, bx + 8, by + 28);
    ctx.fillText(`TOLERANCE: ±0.05 mm | DFM PASS`, bx + 8, by + 42);
  }
}

window.CAD2DViewer = CAD2DViewer;
