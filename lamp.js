// Hollow Cathode Lamp (HCL) Cu: tabung kaca + katoda tembaga, menyala oranye-kehijauan saat ON.
import * as THREE from 'three';
import { mat, addLabel } from './scene.js';

export function createLamp() {
  const group = new THREE.Group();
  group.position.set(-4.6, 0, 0);
  group.userData.key = 'lamp';
  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.2), mat(0x2b2f36));
  stand.position.y = 0.5;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 24),
    new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.1, emissive: 0x9acd32, emissiveIntensity: 0 }));
  glass.rotation.z = Math.PI / 2;
  glass.position.set(0.3, 1.5, 0);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.6, 20), mat(0x15181d));
  base.rotation.z = Math.PI / 2;
  base.position.set(-0.9, 1.5, 0);
  // Katoda tembaga di dalam tabung
  const cathode = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 16), mat(0xb87333, { metalness: 0.9, roughness: 0.3, emissive: 0xffa040, emissiveIntensity: 0 }));
  cathode.rotation.z = Math.PI / 2;
  cathode.position.set(0.1, 1.5, 0);
  const light = new THREE.PointLight(0xc8d84a, 0, 5);
  light.position.set(0.3, 1.5, 0);
  group.add(stand, glass, base, cathode, light);
  addLabel(group, 'Hollow Cathode Lamp (Cu)', 'lamp', [0.3, 2.5, 0]);

  return {
    group,
    setOn(on) {
      cathode.material.emissiveIntensity = on ? 1.2 : 0;
      glass.material.emissiveIntensity = on ? 0.7 : 0;
      light.intensity = on ? 2.5 : 0;
    },
  };
}
