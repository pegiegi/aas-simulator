// Titik masuk: merakit scene, menjalankan loop animasi, dan menghubungkan UI dengan simulasi.
import * as THREE from 'three';
import { initScene, scene, render, enablePicking } from './scene.js';
import { createLamp } from './components/lamp.js';
import { createBurner } from './components/burner.js';
import { createMonochromator } from './components/monochromator.js';
import { createBeam } from './components/beam.js';
import { createComputer } from './components/computer.js';
import { createGas } from './components/gas.js';
import * as ui from './ui.js';
import { cal, absorbance, UNKNOWN_CONC, initChart } from './calibration.js';

// Status simulasi bersama
const state = { lamp: false, gas: false, flame: false, optimized: false, sample: 'blank', conc: 0, A: 0, buf: [], settle: 6 };
const concNow = () => (state.sample === 'unknown' ? UNKNOWN_CONC : state.conc);
const concText = () => (state.sample === 'unknown' ? '? ppm' : concNow().toFixed(2) + ' ppm');
const sampleName = () => ({ blank: 'Blanko', unknown: 'Sampel tak dikenal', manual: 'Manual' }[state.sample] || 'Standar ' + state.sample.slice(1));

initScene(document.getElementById('viewport'));
const lamp = createLamp(), burner = createBurner(), mono = createMonochromator();
const beam = createBeam(), computer = createComputer(), gas = createGas();
[lamp, burner, mono, beam, computer, gas].forEach((c) => scene.add(c.group));
initChart(document.getElementById('chart'));
enablePicking(ui.showInfo);

// Tombol "Ukur & catat": ambil rata-rata pembacaan stabil lalu simpan ke data kalibrasi
function measure() {
  if (!state.lamp || !state.flame) return ui.toast('Nyalakan lampu dan api terlebih dahulu.');
  if (!state.optimized) return ui.toast('Lakukan optimasi terlebih dahulu.');
  if (state.buf.length < 8) return ui.toast('Tunggu pembacaan stabil sebentar…');
  const A = state.buf.reduce((s, v) => s + v, 0) / state.buf.length;
  if (state.sample === 'blank') {
    cal.blank = A;
  } else {
    if (cal.blank == null) return ui.toast('Ukur blanko terlebih dahulu.');
    if (/^s\d$/.test(state.sample)) cal.std[state.conc] = A - cal.blank;
    else if (state.sample === 'unknown') {
      if (Object.keys(cal.std).length < 2) return ui.toast('Ukur minimal 2 standar dahulu.');
      cal.unknown = A - cal.blank;
    } else return ui.toast('Pilih blanko, standar, atau sampel tak dikenal untuk dicatat.');
  }
  ui.renderCalibration();
}
ui.initUI(state, measure);
ui.renderCalibration();

// Loop animasi
const clock = new THREE.Clock();
let acc = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  acc += dt;
  if (acc > 0.15) { // pembacaan detektor ±6,7 kali per detik
    acc = 0;
    const measuring = state.lamp && state.flame;
    const target = measuring ? absorbance(concNow()) : 0; // Lambert-Beer + noise
    state.A += (target - state.A) * 0.6;
    if (!measuring) state.buf = [];
    else if (state.settle > 0) state.settle--;
    else { state.buf.push(state.A); if (state.buf.length > 10) state.buf.shift(); }
    ui.refresh(state, concText());
  }
  const T = Math.pow(10, -Math.max(0, state.A)); // transmitansi
  lamp.setOn(state.lamp);
  gas.setOn(state.gas);
  burner.setSample(concNow());
  burner.update(dt, state.flame, concNow());
  beam.update(state.lamp, T);
  mono.setSignal(state.lamp ? T : 0);
  computer.update(t, { name: sampleName(), concText: concText(), A: state.A, lamp: state.lamp, gas: state.gas, flame: state.flame });
  render();
}
loop();
