// Antarmuka: tombol, pilihan sampel, tabel/grafik kalibrasi, mode penjelasan dan langkah kerja.
import { cal, points, linreg, concFromA, updateChart, themeChart } from './calibration.js';
import { resetCamera, setLabels, setTheme } from './scene.js';

const $ = (id) => document.getElementById(id);

// Penjelasan komponen: kunci -> [judul, isi]
export const INFO = {
  lamp: ['Hollow Cathode Lamp (HCL) Cu', 'Katoda berongga dari tembaga di dalam tabung berisi gas inert (Ne/Ar). Ion gas menembaki katoda sehingga atom Cu terlepas dan tereksitasi, lalu memancarkan garis spektrum khas Cu pada 324,7 nm. Sumber radiasi ini sangat spesifik untuk Cu.'],
  beam: ['Berkas 324,7 nm', 'Garis resonansi Cu melewati nyala. Atom Cu bebas dalam nyala menyerap sebagian energinya sehingga intensitas turun dari I0 menjadi I. Absorbansi A = log(I0/I). Garis UV ini tidak tampak oleh mata; warna di simulasi hanya ilustrasi.'],
  nebulizer: ['Nebulizer + spray chamber', 'Aliran udara cepat menghisap larutan lewat kapiler (efek Venturi) dan memecahnya menjadi aerosol. Spray chamber membuang tetesan besar sehingga hanya aerosol halus yang bercampur dengan gas dan masuk ke burner.'],
  burner: ['Burner head & nyala udara–asetilen', 'Asetilen (bahan bakar) dan udara (oksidator) membentuk nyala sekitar 2300 °C. Di sini pelarut menguap dan senyawa Cu teratomisasi menjadi atom Cu bebas. Nyala tampak hijau-kebiruan saat larutan Cu masuk.'],
  sample: ['Larutan sampel / standar', 'Blanko dipakai untuk nol instrumen. Standar Cu 1–5 ppm dibuat dari larutan induk. Pada rentang linier, absorbansi sebanding dengan konsentrasi (Hukum Lambert–Beer: A = ε·b·c).'],
  mono: ['Monokromator', 'Memilih panjang gelombang 324,7 nm dan menyingkirkan emisi nyala serta garis lain dari lampu, sehingga hanya cahaya yang relevan sampai ke detektor.'],
  slitin: ['Celah masuk', 'Membatasi berkas yang masuk ke monokromator. Lebar celah memengaruhi intensitas cahaya dan resolusi spektral.'],
  grating: ['Kisi (grating)', 'Mendispersikan cahaya menurut panjang gelombang. Memutar kisi mengarahkan hanya 324,7 nm menuju celah keluar.'],
  slitout: ['Celah keluar', 'Hanya meloloskan pita sempit di sekitar 324,7 nm menuju detektor.'],
  pmt: ['Detektor PMT', 'Photomultiplier tube mengubah foton menjadi elektron, lalu dilipatgandakan oleh dynode (sekitar 10⁶ kali) sehingga cahaya lemah menjadi sinyal listrik yang terukur.'],
  computer: ['Komputer & pembaca', 'Mengubah sinyal detektor menjadi absorbansi A = −log(I/I0), menampilkannya real-time, menyimpan kurva kalibrasi, dan menghitung konsentrasi sampel dari persamaan regresi.'],
  gas: ['Tabung asetilen & kompresor udara', 'Menyuplai bahan bakar dan oksidator. Urutan aman: buka udara dahulu, lalu asetilen, baru nyalakan api. Saat mematikan, tutup asetilen lebih dulu. Periksa kebocoran sebelum bekerja.'],
};

// Daftar langkah kerja dan syarat selesainya
const STEPS = [
  ['Nyalakan lampu HCL Cu dan tunggu stabil', (s) => s.lamp],
  ['Buka gas udara dan asetilen', (s) => s.gas],
  ['Nyalakan api', (s) => s.flame],
  ['Optimasi (λ 324,7 nm, posisi burner, energi maksimum)', (s) => s.optimized],
  ['Pilih Blanko, lalu Ukur & catat', () => cal.blank != null],
  ['Ukur Standar 1–5 ppm satu per satu', () => Object.keys(cal.std).length >= 5],
  ['Periksa kurva (R² ≥ 0,995), lalu ukur Sampel tak dikenal', () => cal.unknown != null],
];

let explainOn = true;

export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove('show'), 2400);
}

export function showInfo(key) {
  if (!explainOn || !INFO[key]) return;
  $('infoTitle').textContent = INFO[key][0];
  $('infoText').textContent = INFO[key][1];
}

export function renderCalibration() {
  const rows = [];
  if (cal.blank != null) rows.push(['Blanko (mentah)', cal.blank.toFixed(4)]);
  points().forEach((p) => rows.push([p.x + ' ppm', p.y.toFixed(4)]));
  $('calBody').innerHTML = rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('') || '<tr><td colspan="2">Belum ada data</td></tr>';
  const reg = linreg(points());
  $('eq').textContent = reg
    ? `y = ${reg.a.toFixed(4)}x ${reg.b < 0 ? '−' : '+'} ${Math.abs(reg.b).toFixed(4)}   R² = ${reg.r2.toFixed(4)}`
    : 'y = ax + b (butuh minimal 2 standar)';
  let up = null, res = '';
  if (cal.unknown != null && reg) {
    const c = concFromA(cal.unknown, reg);
    up = { x: c, y: cal.unknown };
    res = `Sampel tak dikenal: A = ${cal.unknown.toFixed(4)} → C = ${c.toFixed(2)} ppm`;
  }
  $('result').textContent = res;
  updateChart(reg, up);
}

export function initUI(state, measure) {
  const reset = () => { state.buf = []; state.settle = 6; }; // tunggu pembacaan stabil lagi
  const stepsEl = $('steps');
  STEPS.forEach(([t]) => { const li = document.createElement('li'); li.textContent = t; stepsEl.appendChild(li); });

  $('btnLamp').onclick = () => { state.lamp = !state.lamp; reset(); };
  $('btnGas').onclick = () => { state.gas = !state.gas; if (!state.gas) state.flame = false; reset(); };
  $('btnFlame').onclick = () => {
    if (!state.gas) return toast('Buka gas udara dan asetilen terlebih dahulu.');
    state.flame = !state.flame;
    reset();
  };
  $('btnOpt').onclick = () => {
    if (!state.lamp || !state.flame) return toast('Nyalakan lampu dan api terlebih dahulu.');
    state.optimized = true;
    toast('Optimasi selesai: λ = 324,7 nm, energi maksimum.');
  };
  $('selSample').onchange = (e) => {
    const v = e.target.value;
    state.sample = v;
    if (v === 'blank') state.conc = 0;
    else if (/^s\d$/.test(v)) state.conc = +v.slice(1);
    $('rngConc').value = state.conc;
    reset();
  };
  $('rngConc').oninput = (e) => {
    state.sample = 'manual';
    $('selSample').value = 'manual';
    state.conc = +e.target.value;
    reset();
  };
  $('btnMeasure').onclick = measure;
  $('btnClear').onclick = () => { cal.blank = null; cal.std = {}; cal.unknown = null; renderCalibration(); };
  $('btnReset').onclick = resetCamera;
  $('btnLabels').onclick = (e) => { const on = e.target.classList.toggle('on'); setLabels(on); };
  $('btnTheme').onclick = () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    setTheme(dark);
    themeChart();
  };
  $('btnSteps').onclick = (e) => { $('steps').hidden = !e.target.classList.toggle('on'); };
  $('btnExplain').onclick = (e) => { explainOn = e.target.classList.toggle('on'); $('info').hidden = !explainOn; };
}

// Perbarui teks tombol, pembacaan, dan status langkah kerja
export function refresh(state, concText) {
  const set = (id, label, on) => { const b = $(id); b.textContent = label + (on ? 'ON' : 'OFF'); b.classList.toggle('on', on); };
  set('btnLamp', 'Lampu HCL: ', state.lamp);
  set('btnGas', 'Gas: ', state.gas);
  set('btnFlame', 'Api: ', state.flame);
  $('btnOpt').classList.toggle('on', state.optimized);
  $('outConc').textContent = concText;
  $('outA').textContent = state.A.toFixed(4);
  let now = true;
  [...$('steps').children].forEach((li, i) => {
    const done = STEPS[i][1](state);
    li.className = done ? 'done' : now ? 'now' : '';
    if (!done) now = false;
  });
}
