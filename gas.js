// Tabung asetilen, kompresor udara, dan pipa menuju burner.
import * as THREE from 'three';
import { mat, addLabel } from './scene.js';

export function createGas() {
  const group = new THREE.Group();
  group.userData.key = 'gas';
  const acet = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.2, 20), mat(0x7a1f2b));
  acet.position.set(-8.6, -1.55, -1.2);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7a1f2b));
  cap.position.set(-8.6, 0.05, -1.2);
  const comp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.2), mat(0x2f5d8a));
  comp.position.set(-8.6, -2.65, 1.4);
  // Pipa: asetilen (merah) dan udara (biru) sepanjang meja menuju ruang pengabut
  const pipeMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0 });
  const mA = pipeMat(0xff5a4a), mB = pipeMat(0x4a9dff);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const pA = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-8.6, 0.2, -1.2), V(-7.6, 0.07, -1.2), V(-3, 0.07, -1.4), V(-0.2, 0.3, -0.45)]), 32, 0.05, 6), mA);
  const pB = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-8.6, -2.1, 1.4), V(-8.6, 0.07, 1.4), V(-7.2, 0.07, 1.4), V(-3, 0.07, 1.1), V(-0.2, 0.3, 0.45)]), 32, 0.05, 6), mB);
  group.add(acet, cap, comp, pA, pB);
  addLabel(group, 'Tabung asetilen', 'gas', [-8.6, 0.9, -1.2]);
  addLabel(group, 'Kompresor udara', 'gas', [-8.6, -1.8, 1.4]);
  return { group, setOn(on) { mA.emissiveIntensity = mB.emissiveIntensity = on ? 0.8 : 0; } };
}
