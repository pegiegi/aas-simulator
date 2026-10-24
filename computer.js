// Komputer pembaca: layar menampilkan absorbansi real-time (canvas sebagai tekstur).
import * as THREE from 'three';
import { mat, addLabel } from '../scene.js';

export function createComputer() {
  const group = new THREE.Group();
  group.position.set(6.3, 0, 1.2);
  group.rotation.y = -0.4;
  group.userData.key = 'computer';
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 320;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.25), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, 1.45, 0.06);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.4, 0.1), mat(0x15181d));
  bezel.position.set(0, 1.45, 0);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 12), mat(0x15181d));
  neck.position.set(0, 0.45, 0);
  const keys = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.5), mat(0x222831));
  keys.position.set(0, 0.03, 0.9);
  group.add(bezel, screen, neck, keys);
  addLabel(group, 'Komputer & pembaca absorbansi', 'computer', [0, 2.5, 0]);
  let last = -1;

  return {
    group,
    // info: {name, concText, A, lamp, gas, flame}; dibatasi ±8x per detik
    update(t, info) {
      if (t - last < 0.12) return;
      last = t;
      g.fillStyle = '#0b1d2a'; g.fillRect(0, 0, 512, 320);
      g.fillStyle = '#7fe3c0'; g.font = 'bold 24px monospace';
      g.fillText('AAS Cu  λ = 324,7 nm', 16, 36);
      g.fillStyle = '#9fb3c8'; g.font = '22px monospace';
      g.fillText('Sampel : ' + info.name, 16, 78);
      g.fillText('Konsentrasi : ' + info.concText, 16, 108);
      g.fillStyle = '#ffb35c'; g.font = 'bold 84px monospace';
      g.fillText(info.A.toFixed(4), 16, 205);
      g.fillStyle = '#9fb3c8'; g.font = '22px monospace';
      g.fillText('Absorbansi (A)', 16, 235);
      g.fillStyle = info.lamp ? '#7fe3c0' : '#e57373'; g.fillText('Lampu ' + (info.lamp ? 'ON' : 'OFF'), 16, 285);
      g.fillStyle = info.gas ? '#7fe3c0' : '#e57373'; g.fillText('Gas ' + (info.gas ? 'ON' : 'OFF'), 190, 285);
      g.fillStyle = info.flame ? '#7fe3c0' : '#e57373'; g.fillText('Api ' + (info.flame ? 'ON' : 'OFF'), 350, 285);
      tex.needsUpdate = true;
    },
  };
}
