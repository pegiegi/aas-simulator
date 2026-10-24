// Monokromator (celah masuk, kisi, celah keluar) dan detektor PMT.
import * as THREE from 'three';
import { mat, cylBetween, addLabel } from './scene.js';

// Celah = dua pelat tipis dengan sela sempit; rotY mengarahkan celah tegak lurus berkas
function slit(x, z, rotY) {
  const g = new THREE.Group();
  [0.09, -0.09].forEach((dz) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.12), mat(0x20242a));
    p.position.z = dz;
    g.add(p);
  });
  g.position.set(x, 1.5, z);
  g.rotation.y = rotY;
  return g;
}

export function createMonochromator() {
  const group = new THREE.Group();
  const casing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 3.2), mat(0xcfd6dd, { transparent: true, opacity: 0.2, roughness: 0.3 }));
  casing.position.set(3.3, 0.9, 0);
  casing.userData.key = 'mono';
  const slitIn = slit(1.95, 0, 0);
  slitIn.userData.key = 'slitin';
  const slitOut = slit(3.6, -0.8, Math.atan2(0.8, 0.6));
  slitOut.userData.key = 'slitout';
  // Kisi: normal bidang dipasang membagi dua sudut datang dan pantul
  const grating = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.7), mat(0xd4af37, { metalness: 1, roughness: 0.2 }));
  grating.position.set(3.0, 1.5, 0);
  grating.rotation.y = Math.atan2(0.894, -0.447);
  grating.userData.key = 'grating';
  // PMT: tabung di ujung jalur cahaya
  const P = new THREE.Vector3(3.9, 1.5, -1.2), end = new THREE.Vector3(4.44, 1.5, -1.92);
  const pmtMat = mat(0x2a2f45, { emissive: 0x4a7dff, emissiveIntensity: 0 });
  const pmt = cylBetween(P, end, 0.25, pmtMat);
  pmt.userData.key = 'pmt';
  group.add(casing, slitIn, slitOut, grating, pmt);
  addLabel(group, 'Monokromator', 'mono', [3.3, 2.5, 0]);
  addLabel(group, 'Celah masuk', 'slitin', [1.95, 2.0, 0.8]);
  addLabel(group, 'Kisi (grating)', 'grating', [3.0, 0.9, 0.5]);
  addLabel(group, 'Celah keluar', 'slitout', [3.6, 0.9, -0.8]);
  addLabel(group, 'Detektor PMT', 'pmt', [4.6, 2.1, -2.1]);

  // Cahaya PMT berpendar sebanding intensitas yang sampai (0-1)
  return { group, setSignal(v) { pmtMat.emissiveIntensity = v; } };
}
