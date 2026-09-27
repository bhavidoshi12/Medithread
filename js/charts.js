/**
 * MediThread - Interactive Longitudinal Biomarker Visualizer
 * High-performance, canvas-based medical charting with normal reference bands, abnormal flags, and tooltips.
 */

export class BiomarkerChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.activeHoverIndex = -1;
    this.setupListeners();
  }

  setupListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleHover(x, y);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.activeHoverIndex = -1;
      this.render();
    });
  }

  setData(dataPoints, config = {}) {
    this.dataPoints = dataPoints || [];
    this.config = {
      markerName: config.markerName || "Biomarker",
      unit: config.unit || "",
      refLow: config.refLow !== undefined ? config.refLow : null,
      refHigh: config.refHigh !== undefined ? config.refHigh : null,
      accentColor: config.accentColor || "#0EA5E9",
      ...config
    };
    this.render();
  }

  handleHover(mouseX, mouseY) {
    if (!this.renderedPoints || this.renderedPoints.length === 0) return;
    
    let closestIndex = -1;
    let minDistance = 25; // 25px hit radius

    this.renderedPoints.forEach((pt, idx) => {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist < minDistance) {
        closestIndex = idx;
      }
    });

    if (this.activeHoverIndex !== closestIndex) {
      this.activeHoverIndex = closestIndex;
      this.render();
    }
  }

  render() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;

    // Adjust canvas dimensions for high-DPI displays
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (!this.dataPoints || this.dataPoints.length === 0) {
      this.renderEmptyState(width, height);
      return;
    }

    const padding = { top: 35, right: 35, bottom: 45, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Compute min and max ranges
    const values = this.dataPoints.map(d => d.markerValue);
    if (this.config.refLow !== null) values.push(this.config.refLow);
    if (this.config.refHigh !== null) values.push(this.config.refHigh);

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const rangeSpan = (maxVal - minVal) || 1;
    const yMin = Math.max(0, Math.floor(minVal - rangeSpan * 0.15));
    const yMax = Math.ceil(maxVal + rangeSpan * 0.15);

    const getY = (val) => padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
    const getX = (idx) => padding.left + (idx / Math.max(1, this.dataPoints.length - 1)) * chartW;

    // 1. Draw Normal Reference Range Band (if present)
    if (this.config.refLow !== null && this.config.refHigh !== null) {
      const yRefHigh = getY(this.config.refHigh);
      const yRefLow = getY(this.config.refLow);
      
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)'; // Subtle emerald
      ctx.fillRect(padding.left, yRefHigh, chartW, yRefLow - yRefHigh);

      // Reference band boundary lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(padding.left, yRefHigh);
      ctx.lineTo(padding.left + chartW, yRefHigh);
      ctx.moveTo(padding.left, yRefLow);
      ctx.lineTo(padding.left + chartW, yRefLow);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label for Reference Band
      ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Target Normal (${this.config.refLow} - ${this.config.refHigh} ${this.config.unit})`, width - padding.right, yRefHigh - 4);
    }

    // 2. Draw Horizontal Grid Lines
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.15)';
    ctx.lineWidth = 1;
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const val = yMin + (i / gridSteps) * (yMax - yMin);
      const y = getY(val);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${val.toFixed(1)} ${this.config.unit}`, padding.left - 8, y + 4);
    }

    // 3. Compute Coordinates
    this.renderedPoints = this.dataPoints.map((d, idx) => ({
      x: getX(idx),
      y: getY(d.markerValue),
      data: d
    }));

    // 4. Draw Area Gradient
    if (this.renderedPoints.length > 1) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

      ctx.beginPath();
      ctx.moveTo(this.renderedPoints[0].x, padding.top + chartH);
      this.renderedPoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(this.renderedPoints[this.renderedPoints.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // 5. Draw Trend Line
    ctx.beginPath();
    ctx.strokeStyle = this.config.accentColor || '#0EA5E9';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    this.renderedPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // 6. Draw Points & Date Labels
    this.renderedPoints.forEach((pt, idx) => {
      const isAbnormal = pt.data.isAbnormal;
      const isHovered = this.activeHoverIndex === idx;

      // Outer glow for abnormal or hovered
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHovered ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isAbnormal ? '#EF4444' : '#0EA5E9';
      ctx.fill();

      // Inner white core
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHovered ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // X-Axis Date Labels
      ctx.fillStyle = isHovered ? '#FFFFFF' : '#94A3B8';
      ctx.font = isHovered ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      
      const dateStr = pt.data.recordedDate ? new Date(pt.data.recordedDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : `T${idx+1}`;
      ctx.fillText(dateStr, pt.x, height - 12);
    });

    // 7. Render Hover Tooltip
    if (this.activeHoverIndex >= 0 && this.renderedPoints[this.activeHoverIndex]) {
      const pt = this.renderedPoints[this.activeHoverIndex];
      const d = pt.data;

      const tooltipText = `${this.config.markerName}: ${d.markerValue} ${this.config.unit}`;
      const statusText = d.isAbnormal ? '⚠️ Out of Target Range' : '✓ Normal Interval';
      const dateFull = d.recordedDate;

      ctx.font = 'bold 12px Inter, sans-serif';
      const textWidth = Math.max(ctx.measureText(tooltipText).width, ctx.measureText(statusText).width, ctx.measureText(dateFull).width) + 24;
      const tooltipH = 58;

      let tooltipX = pt.x - textWidth / 2;
      if (tooltipX < 10) tooltipX = 10;
      if (tooltipX + textWidth > width - 10) tooltipX = width - textWidth - 10;

      let tooltipY = pt.y - tooltipH - 12;
      if (tooltipY < 5) tooltipY = pt.y + 16;

      // Tooltip background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = d.isAbnormal ? '#EF4444' : '#0EA5E9';
      ctx.lineWidth = 1.5;
      
      this.roundRect(ctx, tooltipX, tooltipY, textWidth, tooltipH, 6);
      ctx.fill();
      ctx.stroke();

      // Tooltip texts
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(tooltipText, tooltipX + 12, tooltipY + 18);

      ctx.fillStyle = d.isAbnormal ? '#F87171' : '#34D399';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(statusText, tooltipX + 12, tooltipY + 34);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(dateFull, tooltipX + 12, tooltipY + 48);
    }
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  renderEmptyState(width, height) {
    const ctx = this.ctx;
    ctx.fillStyle = '#64748B';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No longitudinal biomarker readings recorded for this metric.', width / 2, height / 2);
  }
}
