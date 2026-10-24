// Model absorbansi (Lambert-Beer), regresi linear, dan grafik kalibrasi (Chart.js).
export const EPS_B = 0.045;       // ε·b : absorbansi per ppm (b = panjang jalur nyala tetap)
export const OFFSET = 0.003;      // absorbansi latar (blanko)
export const UNKNOWN_CONC = 3.37; // konsentrasi sampel tak dikenal (disembunyikan dari pengguna)

// Data kalibrasi yang sudah dicatat (A standar sudah dikoreksi blanko)
export const cal = { blank: null, std: {}, unknown: null };

// A = ε·b·c + latar + noise acak kecil
export const absorbance = (c) => Math.max(0, EPS_B * c + OFFSET + (Math.random() - 0.5) * 0.004);

export const points = () => Object.entries(cal.std).map(([x, y]) => ({ x: +x, y })).sort((p, q) => p.x - q.x);

// Regresi linear kuadrat terkecil: y = a x + b dan R²
export function linreg(pts) {
  const n = pts.length;
  if (n < 2) return null;
  const sx = pts.reduce((s, p) => s + p.x, 0), sy = pts.reduce((s, p) => s + p.y, 0);
  const sxx = pts.reduce((s, p) => s + p.x * p.x, 0), sxy = pts.reduce((s, p) => s + p.x * p.y, 0);
  const a = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - a * sx) / n;
  const my = sy / n;
  let st = 0, sr = 0;
  pts.forEach((p) => { st += (p.y - my) ** 2; sr += (p.y - (a * p.x + b)) ** 2; });
  return { a, b, r2: st ? 1 - sr / st : 1 };
}

export const concFromA = (A, reg) => (A - reg.b) / reg.a;

let chart;
export function initChart(canvas) {
  chart = new window.Chart(canvas, {
    type: 'scatter',
    data: { datasets: [
      { label: 'Standar', data: [], backgroundColor: '#5bd68a', pointRadius: 5 },
      { label: 'Regresi', type: 'line', data: [], borderColor: '#d98a45', pointRadius: 0, borderWidth: 2 },
      { label: 'Sampel', data: [], backgroundColor: '#ef5350', pointStyle: 'triangle', pointRadius: 8 },
    ] },
    options: { maintainAspectRatio: false, animation: false, scales: {
      x: { type: 'linear', min: 0, max: 10, title: { display: true, text: 'Konsentrasi Cu (ppm)' } },
      y: { min: 0, title: { display: true, text: 'Absorbansi (A)' } } } },
  });
  themeChart();
}

export function updateChart(reg, unknownPt) {
  chart.data.datasets[0].data = points();
  chart.data.datasets[1].data = reg ? [{ x: 0, y: reg.b }, { x: 10, y: reg.a * 10 + reg.b }] : [];
  chart.data.datasets[2].data = unknownPt ? [unknownPt] : [];
  chart.update();
}

// Sesuaikan warna grafik dengan tema aktif
export function themeChart() {
  const s = getComputedStyle(document.documentElement);
  const c = s.getPropertyValue('--text').trim(), g = s.getPropertyValue('--bd').trim();
  ['x', 'y'].forEach((k) => {
    const sc = chart.options.scales[k];
    sc.ticks = { color: c }; sc.title.color = c; sc.grid = { color: g };
  });
  chart.options.plugins = { legend: { labels: { color: c } } };
  chart.update();
}
