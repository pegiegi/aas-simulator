// Nebulizer + spray chamber + selang sampel + burner head + nyala animasi (partikel).
import * as THREE from 'three';
import { mat, addLabel } from '../scene.js';

// Tekstur lingkaran lembut untuk partikel api
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createBurner() {
  const group = new THREE.Group();
  const steel = mat(0x9aa3ad, { metalness: 0.8, roughness: 0.35 });
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 24), steel);
  chamber.position.set(0, 0.5, 0);
  chamber.userData.key = 'nebulizer';
  const neb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), mat(0x333840));
  neb.rotation.z = Math.PI / 2;
  neb.position.set(-0.65, 0.5, 0);
  neb.userData.key = 'nebulizer';
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.2), steel);
  head.position.set(0, 0.96, 0);
  head.userData.key = 'burner';

  // Gelas sampel + cairan + selang kapiler menuju nebulizer
  const beaker = new THREE.Group();
  beaker.position.set(-2.3, 0, 1.8);
  beaker.userData.key = 'sample';
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
  glass.position.y = 0.35;
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.5, 20), new THREE.MeshStandardMaterial({ color: 0xd8ecff, transparent: true, opacity: 0.85 }));
  liquid.position.y = 0.27;
  beaker.add(glass, liquid);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.3, 0.15, 1.8), new THREE.Vector3(-2.3, 1.0, 1.8),
    new THREE.Vector3(-1.4, 0.9, 0.8), new THREE.Vector3(-0.9, 0.5, 0)]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: 0.7 }));
  tube.userData.key = 'nebulizer';

  // Nyala: partikel bercahaya yang naik dari burner head
  const N = 400;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const life = new Float32Array(N), ox = new Float32Array(N), oz = new Float32Array(N), spd = new Float32Array(N);
  const respawn = (i) => { ox[i] = (Math.random() - 0.5) * 1.5; oz[i] = (Math.random() - 0.5) * 0.14; };
  for (let i = 0; i < N; i++) { life[i] = Math.random(); spd[i] = 0.8 + Math.random() * 0.8; respawn(i); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const flame = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.28, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flame.frustumCulled = false;
  flame.visible = false;
  flame.userData.key = 'burner';
  const light = new THREE.PointLight(0xff9a40, 0, 6);
  light.position.set(0, 1.6, 0.5);
  const orange = new THREE.Color(0xff9a40), green = new THREE.Color(0x40ff80);

  group.add(chamber, neb, head, beaker, tube, flame, light);
  addLabel(group, 'Burner head (udara–asetilen)', 'burner', [0, 2.7, 0]);
  addLabel(group, 'Nebulizer + spray chamber', 'nebulizer', [-0.4, -0.35, 0.9]);
  addLabel(beaker, 'Larutan sampel', 'sample', [0, 1.2, 0]);

  return {
    group,
    // Warna cairan mengikuti konsentrasi Cu (biru Cu²⁺)
    setSample(c) { liquid.material.color.set(0xd8ecff).lerp(new THREE.Color(0x1f6bff), Math.min(1, c / 6)); },
    // on: api menyala; c: konsentrasi Cu (ppm) yang sedang diaspirasi
    update(dt, on, c) {
      flame.visible = on;
      light.intensity = on ? 1.5 : 0;
      if (!on) return;
      const g = c > 0 ? Math.min(1, 0.3 + c / 6) : 0; // porsi warna hijau akibat emisi Cu
      light.color.lerpColors(orange, green, g);
      for (let i = 0; i < N; i++) {
        life[i] += dt * spd[i];
        if (life[i] > 1) { life[i] = 0; respawn(i); }
        const l = life[i], k = 1 - 0.45 * l, f = 1 - 0.85 * l;
        pos[3 * i] = ox[i] * k; pos[3 * i + 1] = 1.05 + l * 1.05; pos[3 * i + 2] = oz[i] * k;
        // biru di dasar -> oranye di ujung; dicampur hijau jika ada Cu
        const r = 0.3 + 0.7 * l, gg = 0.5 + 0.1 * l, b = 1 - 0.8 * l;
        col[3 * i] = (r + (0.25 - r) * g) * f;
        col[3 * i + 1] = (gg + (1 - gg) * g) * f;
        col[3 * i + 2] = (b + (0.45 - b) * g) * f;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
  };
}
