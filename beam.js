// Berkas cahaya 324,7 nm dari lampu -> nyala -> monokromator -> PMT.
// Opasitas setelah nyala mengikuti transmitansi T = 10^-A.
import * as THREE from 'three';
import { cylBetween, addLabel } from '../scene.js';

export function createBeam() {
  const group = new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // Titik jalur: lampu, tepi nyala, tepi nyala, celah masuk, kisi, celah keluar, PMT
  const P = [V(-3.4, 1.5, 0), V(-0.8, 1.5, 0), V(0.8, 1.5, 0), V(1.9, 1.5, 0), V(3.0, 1.5, 0), V(3.6, 1.5, -0.8), V(3.9, 1.5, -1.2)];
  const mats = [];
  for (let i = 0; i < P.length - 1; i++) {
    const m = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false });
    const s = cylBetween(P[i], P[i + 1], i === 1 ? 0.05 : 0.035, m);
    s.userData.key = 'beam';
    group.add(s);
    mats.push(m);
  }
  addLabel(group, 'Berkas 324,7 nm', 'beam', [-2.1, 2.1, 0]);

  return {
    group,
    // on: lampu menyala, T: transmitansi (0-1)
    update(on, T) {
      mats.forEach((m, i) => {
        const f = i === 0 ? 1 : i === 1 ? Math.sqrt(T) : T;
        m.opacity = on ? 0.15 + 0.6 * f : 0;
      });
    },
  };
}
