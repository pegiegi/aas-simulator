// Ruang gas terpisah (di kiri, di balik sekat): tabung asetilen, kompresor udara, dan pipa menuju alat.
import * as THREE from 'three';
import { mat, addLabel } from './scene.js';

export function createGas() {
  const group = new THREE.Group();
  group.userData.key = 'gas';
  const slab = new THREE.Mesh(new THREE.BoxGeometry(9, 0.1, 6), mat(0x59606a));
  slab.position.set(-12, -3.1, 0.2);
  const acet = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.2, 20), mat(0x7a1f2b));
  acet.position.set(-11, -1.55, -1.2);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7a1f2b));
  cap.position.set(-11, 0.05, -1.2);
  const comp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.2), mat(0x2f5d8a));
  comp.position.set(-11, -2.65, 1.6);
  group.add(slab, acet, cap, comp);
  // Pipa menembus sekat menuju burner di dalam alat
  const pipe = (pts, c) => {
    const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0 });
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 48, 0.05, 6), m));
    return m;
  };
  const mA = pipe([[-11, 0.2, -1.2], [-11, 2, -1.2], [-7, 2, -1.2], [-3.4, 2, -1], [-1.5, 1.8, -0.7], [0.1, 1, -0.2]], 0xff5a4a);
  const mB = pipe([[-11, -2.1, 1.6], [-11, 1.6, 1.6], [-7, 1.6, 0.9], [-3.4, 1.6, 0.6], [-1.5, 1.5, 0.4], [0.1, 1, 0.2]], 0x4a9dff);
  addLabel(group, 'Tabung asetilen', 'gas', [-11, 0.9, -1.2]);
  addLabel(group, 'Kompresor udara', 'gas', [-11, -1.8, 1.6]);
  addLabel(group, 'Ruang gas & kompresor (terpisah)', 'gas', [-11, 3.4, 0.2]);
  return { group, setOn(on) { mA.emissiveIntensity = mB.emissiveIntensity = on ? 0.8 : 0; } };
}
