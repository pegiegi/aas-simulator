// Pengaturan scene dasar: renderer, kamera, kontrol, meja lab, label, dan picking.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
export const renderer = new THREE.WebGLRenderer({ antialias: true });
export const labelRenderer = new CSS2DRenderer();
let controls, floor, tween = null, labelClick = () => {};

// Material standar agar kode komponen singkat
export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2, ...o });

// Silinder yang menghubungkan titik a ke titik b (untuk berkas, pipa, dll.)
export function cylBetween(a, b, r, material) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), material);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return m;
}

// Menambah label HTML (CSS2D) pada objek; klik label memicu penjelasan
export function addLabel(parent, text, key, pos) {
  const el = document.createElement('div');
  el.className = 'label';
  el.textContent = text;
  el.addEventListener('click', () => labelClick(key));
  const l = new CSS2DObject(el);
  l.position.set(...pos);
  parent.add(l);
}

export function initScene(container) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.append(renderer.domElement, labelRenderer.domElement);
  Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.maxDistance = 60;
  controls.addEventListener('start', () => { tween = null; });
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 2.2);
  dl.position.set(6, 12, 10);
  scene.add(dl);
  floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat(0x222a33, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.15;
  scene.add(floor);
  new ResizeObserver(() => resize(container)).observe(container);
  resize(container);
  const [p0, t0] = overview();
  camera.position.set(...p0);
  controls.target.set(...t0);
  controls.update();
  setTheme(true);
}

function resize(c) {
  const w = c.clientWidth, h = c.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// Posisi kamera awal: [posisi, target]
export function overview() { return camera.aspect < 1.2 ? [[-5, 8, 40], [-5, 2, 0]] : [[-5, 6, 22], [-5, 2, 0]]; }

// Terbang halus ke posisi p dengan target t
export function flyTo(p, t, ms = 1100) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), s: performance.now(), ms };
}
export function resetCamera() { const [p, t] = overview(); flyTo(p, t); }

export const setLabels = (v) => { labelRenderer.domElement.style.display = v ? '' : 'none'; };

export function setTheme(dark) {
  scene.background = new THREE.Color(dark ? 0x141a33 : 0xdfe6ed);
  floor.material.color.set(dark ? 0x1b2430 : 0xb9c3cd);
}

// Klik (bukan seret) pada komponen -> panggil cb(key); klik label juga memakai cb
export function enablePicking(cb) {
  labelClick = cb;
  const ray = new THREE.Raycaster(), m = new THREE.Vector2(), el = renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  el.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = el.getBoundingClientRect();
    m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(m, camera);
    for (const h of ray.intersectObjects(scene.children, true)) {
      if (h.object.userData.shell && h.object.material.opacity < 0.5) continue; // abaikan bodi saat tembus pandang
      let o = h.object;
      while (o && !o.userData.key) o = o.parent;
      if (o) { cb(o.userData.key); return; }
    }
  });
}

export function render() {
  if (tween) {
    const k = Math.min(1, (performance.now() - tween.s) / tween.ms), e = k * k * (3 - 2 * k);
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (k >= 1) tween = null;
  }
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
