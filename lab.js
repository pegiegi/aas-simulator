// Bodi instrumen (bergaya AA-7000), meja lab, dinding, exhaust hood, dan UPS.
import * as THREE from 'three';
import { mat, addLabel } from './scene.js';

const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };

export function createInstrument() {
  const g = new THREE.Group();
  g.userData.key = 'body';
  const W = mat(0xeef0f2, { roughness: 0.5, metalness: 0.05 });
  const K = mat(0x14161a, { roughness: 0.25, metalness: 0.3 });
  const G = mat(0x4a5058);
  const add = (...a) => { const o = box(...a); o.userData.shell = true; g.add(o); return o; };
  // Badan putih dengan bukaan jendela (x -0,8..1,4; y 0,95..2,05) agar nyala terlihat
  add(2.7, 2.5, 2.3, W, -2.15, 1.25, -0.15);
  add(2.1, 2.5, 2.3, W, 2.45, 1.25, -0.15);
  add(2.2, 0.45, 2.3, W, 0.3, 2.275, -0.15);
  add(2.2, 0.95, 2.3, W, 0.3, 0.475, -0.15);
  add(2.2, 1.1, 0.05, W, 0.3, 1.5, -1.27);
  add(7, 0.45, 0.04, G, 0, 0.25, 1.02);
  // Kubah hitam kompartemen lampu + stiker
  add(2.6, 0.9, 2.0, K, -1.9, 2.95, -0.2).userData.key = 'dome';
  add(0.35, 0.35, 0.02, W, -2.4, 3.0, 0.81);
  add(0.35, 0.35, 0.02, W, -1.9, 3.0, 0.81);
  // Kaca jendela depan (menampilkan burner dan nyala)
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshStandardMaterial({ color: 0x9bb7d4, transparent: true, opacity: 0.12, depthWrite: false }));
  win.position.set(0.3, 1.5, 1.0);
  win.userData.key = 'burner';
  g.add(win);
  // Tombol panel kanan
  [0x4caf50, 0xffb300, 0xe53935].forEach((c, i) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), mat(c));
    b.rotation.x = Math.PI / 2;
    b.position.set(2.2 + i * 0.3, 1.9, 1.02);
    g.add(b);
  });
  addLabel(g, 'Bodi instrumen', 'body', [2.5, 2.9, 1]);
  addLabel(g, 'Kompartemen lampu', 'dome', [-1.9, 3.7, 0]);
  return {
    group: g,
    // Tembus pandang: bodi hampir transparan agar bagian dalam terlihat
    setXray(on) { [W, K, G].forEach((m) => { m.transparent = on; m.opacity = on ? 0.1 : 1; m.depthWrite = !on; m.needsUpdate = true; }); },
  };
}

export function createRoom() {
  const group = new THREE.Group(), env = new THREE.Group();
  group.add(env);
  const tile = mat(0xf1f3f5, { roughness: 0.9, metalness: 0 });
  // Meja: permukaan, sisi, belakang, pintu gelap, jerigen limbah
  group.add(box(12, 0.3, 5.5, mat(0xf7f8f9, { roughness: 0.7 }), 1, -0.15, 0));
  [-4.9, 6.9].forEach((x) => group.add(box(0.3, 3, 5.2, tile, x, -1.65, 0)));
  group.add(box(11.5, 3, 0.2, tile, 1, -1.65, -2.55));
  [2.2, 4, 5.8].forEach((x) => group.add(box(1.7, 2.7, 0.05, mat(0x15181d), x, -1.6, 2.6)));
  group.add(box(0.7, 1, 0.5, mat(0xf4f4f4), -2.4, -2.6, 1.2));
  // Dinding belakang dan sekat pemisah ruang gas
  env.add(box(26, 10.5, 0.3, tile, -5, 2.1, -3.1));
  env.add(box(0.3, 10.5, 6.5, tile, -7, 2.1, 0.2));
  // Exhaust hood di atas alat + saluran ke dinding
  const steel = mat(0xb9c0c8, { metalness: 0.9, roughness: 0.3 });
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.7, 0.8, 4), steel);
  hood.rotation.y = Math.PI / 4;
  hood.position.set(0.3, 4.3, 0);
  hood.userData.key = 'hood';
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const duct = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0.3, 4.7, 0), V(0.3, 6.2, 0), V(0.3, 6.9, -0.8), V(0.3, 6.9, -2.9)]), 32, 0.2, 10), steel);
  duct.userData.key = 'hood';
  // UPS di kiri alat
  const ups = box(0.9, 1.1, 1.1, mat(0x16181c), -4.3, 0.55, 0.2);
  ups.userData.key = 'ups';
  env.add(hood, duct, ups);
  addLabel(env, 'Exhaust hood', 'hood', [0.3, 5.3, 0]);
  addLabel(env, 'UPS', 'ups', [-4.3, 1.4, 0.2]);
  return { group, env };
}
