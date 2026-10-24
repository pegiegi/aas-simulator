// Antarmuka: tombol, pilihan sampel, tabel/grafik kalibrasi, mode penjelasan dan langkah kerja.
import { cal, points, linreg, concFromA, updateChart, themeChart } from './calibration.js';
import { resetCamera, flyTo, setLabels, setTheme } from './scene.js';

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

INFO.overview = ['Overview', 'Model 3D AAS nyala bergaya AA-7000 di meja lab. Putar, zoom, dan geser kamera. Klik komponen atau pilih dari daftar di kiri untuk melihat fungsinya. Peralatan gas ada di ruang terpisah di kiri, dan exhaust hood menghisap uap nyala dari atas alat.'];
INFO.principle = ['Prinsip kerja AAS nyala', 'Lampu HCL Cu memancarkan garis 324,7 nm. Larutan sampel dikabutkan lalu diatomisasi dalam nyala udara–asetilen. Atom Cu menyerap sebagian cahaya, monokromator memisahkan 324,7 nm, PMT mengukur intensitas, dan komputer menghitung absorbansi. Absorbansi sebanding dengan konsentrasi (Lambert–Beer), sehingga konsentrasi sampel dibaca dari kurva kalibrasi.'];
INFO.body = ['Bodi instrumen', 'Rumah sistem optik dan atomisasi. Jendela depan memperlihatkan nyala. Tekan Tembus Pandang untuk melihat lampu, monokromator, dan detektor di dalamnya.'];
INFO.dome = ['Kompartemen lampu HCL', 'Penutup hitam di atas alat melindungi lampu hollow cathode. Lampu perlu dipanaskan beberapa menit agar emisinya stabil sebelum pengukuran.'];
INFO.hood = ['Exhaust hood', 'Menghisap gas hasil pembakaran dan uap logam dari nyala, lalu membuangnya lewat saluran ke luar ruangan. Harus menyala selama api hidup.'];
INFO.ups = ['UPS', 'Menjaga pasokan listrik tetap stabil agar instrumen dan komputer tidak mati mendadak saat pengukuran.'];
INFO.gas = ['Ruang gas & kompresor', 'Tabung asetilen dan kompresor udara ditempatkan di ruangan terpisah demi keselamatan; gas dialirkan lewat pipa ke alat. Buka udara dahulu, lalu asetilen, baru nyalakan api. Saat mematikan, tutup asetilen lebih dulu.'];

// Daftar langkah kerja dan syarat selesainya
const STEPS = [
  ['Nyalakan komputer dan monitor', (s) => s.pc && s.monitor],
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
  if (!INFO[key]) return;
  setTab('info');
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

// Titik fokus kamera: [x, y, z, jarak, tembus pandang?]
const FOCUS = {
  body: [0.3, 1.5, 0, 11, 0], dome: [-1.9, 3, 0, 6, 0], lamp: [-2.1, 1.5, 0, 6, 1], beam: [-0.3, 1.5, 0, 7, 1],
  nebulizer: [-0.2, 0.8, 0.9, 6, 1], burner: [0.3, 1.5, 0, 4.5, 0], sample: [-0.9, 0.4, 1.9, 5, 0],
  mono: [2.1, 1.5, 0, 7, 1], slitin: [1.4, 1.5, 0, 4, 1], grating: [1.95, 1.5, 0, 4, 1], slitout: [2.3, 1.5, -0.4, 4, 1],
  pmt: [2.5, 1.5, -0.7, 5, 1], computer: [5.4, 1.4, 0.5, 6, 0], hood: [0.3, 4.6, 0, 9, 0], gas: [-11, -0.5, 0, 12, 0], ups: [-4.3, 0.6, 0.2, 5, 0],
};
const SECS = [['overview', '1 · Overview'], ['room', 'Instrumen saja'], ['nebulizer', '2 · Sample introduction'], ['burner', '3 · Atomization'], ['mono', '4 · Optical system'], ['pmt', '5 · Detection'], ['hood', '6 · Safety system'], ['ups', '7 · Kelistrikan']];
const COMPS = [['dome', 'Kompartemen lampu HCL'], ['lamp', 'Hollow cathode lamp'], ['beam', 'Berkas 324,7 nm'], ['sample', 'Larutan sampel'], ['nebulizer', 'Nebulizer + spray chamber'], ['burner', 'Burner & nyala'], ['slitin', 'Celah masuk'], ['grating', 'Kisi (grating)'], ['slitout', 'Celah keluar'], ['mono', 'Monokromator'], ['pmt', 'Detektor PMT'], ['computer', 'Komputer'], ['hood', 'Exhaust hood'], ['gas', 'Ruang gas & kompresor'], ['ups', 'UPS']];
const CHIPS = [['sample', 'Sampel'], ['nebulizer', 'Nebulizer'], ['nebulizer', 'Spray chamber'], ['burner', 'Burner / nyala'], ['burner', 'Atomisasi'], ['mono', 'Monokromator'], ['pmt', 'Detektor'], ['computer', 'Sinyal'], ['cal', 'Konsentrasi'], ['cal', 'Kurva kalibrasi']];

let H = {}, xrayOn = false, roomOn = true, tourT = [];

function setTab(t) {
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  ['Info', 'Ctl', 'Cal'].forEach((n) => { $('pane' + n).hidden = n.toLowerCase() !== t; });
}
function setXray(on) { xrayOn = on; H.xray(on); $('btnXray').classList.toggle('on', on); }

// Terbang ke komponen, atur tembus pandang, dan tampilkan penjelasan
export function focus(key) {
  const f = FOCUS[key];
  if (!f) return;
  setXray(!!f[4]);
  flyTo([f[0] + f[3] * 0.15, f[1] + f[3] * 0.35, f[2] + f[3] * 0.93], [f[0], f[1], f[2]]);
  showInfo(key);
}
function home() { setXray(false); resetCamera(); showInfo('overview'); }
function tour(keys) { tourT.forEach(clearTimeout); tourT = keys.map((k, i) => setTimeout(() => focus(k), i * 2800)); }

export function initUI(state, measure, hooks) {
  H = hooks;
  const reset = () => { state.buf = []; state.settle = 6; }; // tunggu pembacaan stabil lagi
  const mk = (box, text, fn) => { const b = document.createElement('button'); b.textContent = text; b.onclick = fn; $(box).appendChild(b); return b; };
  STEPS.forEach(([t]) => { const li = document.createElement('li'); li.textContent = t; $('steps').appendChild(li); });
  SECS.forEach(([k, t]) => {
    const b = mk('secs', t, () => {
      document.body.classList.remove('menu');
      if (k === 'overview') return home();
      if (k !== 'room') return focus(k);
      roomOn = !roomOn; H.room(roomOn); b.classList.toggle('on', !roomOn);
      roomOn ? home() : focus('body');
    });
  });
  COMPS.forEach(([k, t]) => mk('comps', t, () => { document.body.classList.remove('menu'); focus(k); }));
  CHIPS.forEach(([k, t]) => mk('chips', t, () => (k === 'cal' ? setTab('cal') : focus(k))));
  document.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => setTab(b.dataset.tab); });

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
  $('rngConc').oninput = (e) => { state.sample = 'manual'; $('selSample').value = 'manual'; state.conc = +e.target.value; reset(); };
  $('btnMeasure').onclick = measure;
  $('btnClear').onclick = () => { cal.blank = null; cal.std = {}; cal.unknown = null; renderCalibration(); };

  $('btnStart').onclick = () => { setTab('ctl'); home(); toast('Ikuti langkah kerja pada tab Kontrol.'); };
  $('btnComp').onclick = (e) => setLabels(e.currentTarget.classList.toggle('on'));
  $('btnPath').onclick = () => tour(['sample', 'nebulizer', 'burner', 'mono', 'pmt', 'computer']);
  $('btnPrin').onclick = () => showInfo('principle');
  $('btnXray').onclick = () => setXray(!xrayOn);
  $('btnCalc').onclick = () => setTab('cal');
  $('btnPC').onclick = () => { state.pc = !state.pc; };
  $('btnMon').onclick = () => { state.monitor = !state.monitor; };
  $('btnCam').onclick = home;
  $('btnFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
  $('btnMenu').onclick = () => document.body.classList.toggle('menu');
  $('btnTheme').onclick = () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    setTheme(dark);
    themeChart();
  };
}

// Perbarui teks tombol, pembacaan, dan status langkah kerja
export function refresh(state, concText) {
  const set = (id, label, on) => { const b = $(id); b.textContent = label + (on ? 'ON' : 'OFF'); b.classList.toggle('on', on); };
  set('btnLamp', 'Lampu HCL: ', state.lamp);
  set('btnGas', 'Gas: ', state.gas);
  set('btnFlame', 'Api: ', state.flame);
  $('btnOpt').classList.toggle('on', state.optimized);
  $('btnPC').textContent = (state.pc ? 'Matikan' : 'Nyalakan') + ' komputer';
  $('btnMon').textContent = (state.monitor ? 'Matikan' : 'Nyalakan') + ' monitor';
  $('btnPC').classList.toggle('on', state.pc);
  $('btnMon').classList.toggle('on', state.monitor);
  $('outConc').textContent = concText;
  $('outA').textContent = state.A.toFixed(4);
  let now = true;
  [...$('steps').children].forEach((li, i) => {
    const done = STEPS[i][1](state);
    li.className = done ? 'done' : now ? 'now' : '';
    if (!done) now = false;
  });
}
