/**
 * MethodWise AI - SVG & Canvas Chart Rendering Utilities
 */

class ChartRenderer {
  /**
   * Render an animated circular gauge ring
   */
  static renderCircularGauge(containerId, value, label, color = '#00f2fe') {
    const el = document.getElementById(containerId);
    if (!el) return;

    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    el.innerHTML = `
      <div class="circular-chart-card" style="text-align: center;">
        <div class="svg-ring-container" style="width: ${size}px; height: ${size}px;">
          <svg class="svg-ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle class="svg-ring-bg" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${strokeWidth}" />
            <circle class="svg-ring-val" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" style="transition: stroke-dashoffset 1.2s ease-in-out;" />
          </svg>
          <div class="svg-ring-text"><span class="gauge-value-num">0</span>%</div>
        </div>
        <div class="gauge-label" style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-top: 6px;">${label}</div>
      </div>
    `;

    setTimeout(() => {
      const circle = el.querySelector('.svg-ring-val');
      if (circle) circle.style.strokeDashoffset = strokeDashoffset;
      this.animateNumber(el.querySelector('.gauge-value-num'), 0, value, 1000);
    }, 100);
  }

  static animateNumber(el, start, end, duration) {
    if (!el) return;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      let progress = Math.min(1, (timestamp - startTime) / duration);
      let current = Math.floor(progress * (end - start) + start);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /**
   * Render Canvas Bar Chart
   */
  static renderBarChart(canvasId, labels, data, colors = ['#00f2fe', '#4facfe', '#7928ca', '#3b82f6', '#10b981']) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 400;
    const h = canvas.height = 220;
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...data) * 1.15;
    const barWidth = (w - 60) / data.length - 16;

    data.forEach((val, i) => {
      const barH = (val / max) * (h - 60);
      const x = 40 + i * (barWidth + 16);
      const y = h - 35 - barH;

      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val, x + barWidth / 2, y - 6);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(labels[i], x + barWidth / 2, h - 12);
    });
  }

  /**
   * Render Canvas Line Chart
   */
  static renderLineChart(canvasId, labels, data, color = '#00f2fe') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 400;
    const h = canvas.height = 220;
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...data) * 1.15;
    const stepX = (w - 60) / (data.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    data.forEach((val, i) => {
      const x = 40 + i * stepX;
      const y = h - 35 - (val / max) * (h - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    data.forEach((val, i) => {
      const x = 40 + i * stepX;
      const y = h - 35 - (val / max) * (h - 60);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#040914';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x, h - 12);
    });
  }

  /**
   * Render Canvas Radar Chart
   */
  static renderRadarChart(canvasId, labels, data, color = '#00f2fe') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 400;
    const h = canvas.height = 220;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2 - 35;
    const total = labels.length;

    // Draw grid rings
    [0.25, 0.5, 0.75, 1].forEach(r => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < total; i++) {
        const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
        const x = centerX + radius * r * Math.cos(angle);
        const y = centerY + radius * r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Draw Data Polygon
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    data.forEach((val, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const r = (val / 100) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw Labels
    labels.forEach((lbl, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const x = centerX + (radius + 18) * Math.cos(angle);
      const y = centerY + (radius + 18) * Math.sin(angle);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, x, y);
    });
  }
}

window.ChartRenderer = ChartRenderer;
