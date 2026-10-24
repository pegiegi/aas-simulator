// Pengaturan scene dasar: renderer, kamera, kontrol, meja lab, label, dan picking.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
export const renderer = new THREE.WebGLRenderer({ antialias: true });
export const labelRenderer = new CSS2DRenderer();
let controls, floor, labelClick = () => {};

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
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 2.2);
  dl.position.set(6, 12, 10);
  scene.add(dl);
  // Meja lab: papan, empat kaki, lantai
  const top = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 5.5), mat(0xdde2e6));
  top.position.set(0.5, -0.15, 0);
  scene.add(top);
  [[-7, -2.4], [8, -2.4], [-7, 2.4], [8, 2.4]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), mat(0x555d66));
    leg.position.set(x, -1.65, z);
    scene.add(leg);
  });
  floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(0x222a33, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.15;
  scene.add(floor);
  new ResizeObserver(() => resize(container)).observe(container);
  resize(container);
  resetCamera();
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

export function resetCamera() {
  camera.position.set(1, 5.5, camera.aspect < 1.2 ? 22 : 13.5);
  controls.target.set(1, 1, 0);
  controls.update();
}

export const setLabels = (v) => { labelRenderer.domElement.style.display = v ? '' : 'none'; };

export function setTheme(dark) {
  scene.background = new THREE.Color(dark ? 0x0e1621 : 0xdfe6ed);
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
      let o = h.object;
      while (o && !o.userData.key) o = o.parent;
      if (o) { cb(o.userData.key); return; }
    }
  });
}

export function render() {
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
