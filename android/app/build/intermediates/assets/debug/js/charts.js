/**
 * MethodWise AI - SVG & Canvas Chart Rendering Utilities
 */

class ChartRenderer {
  /**
   * Render an animated circular gauge ring
   * @param {string} containerId - Element ID
   * @param {number} value - Score value (0-100)
   * @param {string} label - Metric Title
   * @param {string} color - Hex or Gradient color
   */
  static renderCircularGauge(containerId, value, label, color = '#00f2fe') {
    const el = document.getElementById(containerId);
    if (!el) return;

    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    el.innerHTML = `
      <div class="circular-chart-card">
        <div class="circular-chart-svg-wrap">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <!-- Background circle -->
            <circle
              cx="${size / 2}"
              cy="${size / 2}"
              r="${radius}"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              stroke-width="${strokeWidth}"
            />
            <!-- Progress circle -->
            <circle
              class="gauge-progress-circle"
              cx="${size / 2}"
              cy="${size / 2}"
              r="${radius}"
              fill="none"
              stroke="${color}"
              stroke-width="${strokeWidth}"
              stroke-linecap="round"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}"
              style="transition: stroke-dashoffset 1.5s ease-in-out;"
            />
          </svg>
          <div class="gauge-center-text">
            <span class="gauge-value-num">0</span><span class="gauge-percent">%</span>
          </div>
        </div>
        <div class="gauge-label">${label}</div>
      </div>
    `;

    // Trigger smooth stroke offset animation
    setTimeout(() => {
      const circle = el.querySelector('.gauge-progress-circle');
      if (circle) {
        circle.style.strokeDashoffset = strokeDashoffset;
      }
      this.animateNumber(el.querySelector('.gauge-value-num'), 0, value, 1200);
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
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }
}

window.ChartRenderer = ChartRenderer;
