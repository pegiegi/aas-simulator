# Simulasi 3D AAS Nyala – Analisis Tembaga (Cu)

Simulasi interaktif Atomic Absorption Spectrophotometer (flame, udara–asetilen) untuk analisis Cu pada 324,7 nm.
Dibuat dengan Three.js dan Chart.js, 100% static (tanpa backend).

![Screenshot](assets/screenshot.png)

## Fitur
- Model 3D: HCL Cu, berkas cahaya, nebulizer + spray chamber, burner + nyala animasi, monokromator, PMT, komputer, tabung gas.
- Tombol lampu, gas, api, optimasi; pilihan blanko, standar 1–5 ppm, sampel tak dikenal, dan slider 0–10 ppm.
- Absorbansi memakai Hukum Lambert-Beer (A = ε·b·c) ditambah noise acak kecil.
- Kurva kalibrasi, regresi linear (y = ax + b, R²), dan perhitungan konsentrasi sampel.
- Mode Penjelasan (klik komponen) dan Langkah Kerja, tema gelap/terang, responsif.

## Menjalankan di komputer
Modul ES tidak jalan dari `file://`, jadi gunakan server lokal:

```bash
python3 -m http.server 8000   # lalu buka http://localhost:8000
```

## Deploy ke GitHub Pages
1. Push ke branch `main`.
2. Di repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` berjalan otomatis; alamat situs tampil di tab **Actions**.

## Lisensi
MIT License. Copyright (c) 2026 Pemilik repo.
Izin diberikan secara gratis untuk menggunakan, menyalin, memodifikasi, dan mendistribusikan perangkat lunak ini tanpa jaminan apa pun.
