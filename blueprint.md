1. Konsep MVP

Pada versi MVP, seluruh data disimpan di Local Storage browser.

Artinya:

Data siswa

Data absensi

Data login

Data laporan

disimpan di browser pengguna.

Arsitektur MVP
Browser
│
├── HTML
├── CSS
├── JavaScript
│
└── Local Storage
      ├── users
      ├── students
      └── attendance

Tidak ada:

server

database

API

2. Struktur Folder Project
absensi-qr-mvp/
│
├── index.html
├── login.html
├── dashboard.html
├── scan.html
├── laporan.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── auth.js
│   ├── storage.js
│   ├── scanner.js
│   ├── dashboard.js
│   ├── import.js
│   └── laporan.js
│
├── assets/
│   ├── sound/
│   │   └── success.mp3
│   └── images/
│
└── lib/
    ├── html5-qrcode.min.js
    ├── papaparse.min.js
    └── chart.min.js
3. Struktur Data di Local Storage
3.1 Users
{
 "users":[
  {
   "username":"admin",
   "password":"admin123",
   "role":"admin"
  },
  {
   "username":"operator",
   "password":"operator123",
   "role":"operator"
  }
 ]
}
3.2 Students
{
 "students":[
  {
   "nis":"1001",
   "nama":"Budi Santoso",
   "kelas":"10A"
  },
  {
   "nis":"1002",
   "nama":"Siti Aminah",
   "kelas":"10A"
  }
 ]
}
3.3 Attendance
{
 "attendance":[
  {
   "nis":"1001",
   "tanggal":"2026-03-12",
   "waktu":"07:01"
  }
 ]
}
4. App Flow (MVP)
4.1 Flow Login
User membuka halaman login
        ↓
Input username dan password
        ↓
Sistem membaca data users di Local Storage
        ↓
Jika cocok → masuk dashboard
Jika tidak cocok → tampil pesan error
4.2 Flow Import Data Siswa
Admin membuka menu Import Data
        ↓
Upload file CSV
        ↓
PapaParse membaca file
        ↓
Data siswa dimasukkan ke Local Storage

Format CSV:

nis,nama,kelas
1001,Budi Santoso,10A
1002,Siti Aminah,10A
4.3 Flow Scan QR Code
Operator membuka halaman scan
        ↓
Kamera aktif
        ↓
QR Code dipindai
        ↓
Sistem membaca NIS
        ↓
Cek data siswa di Local Storage
        ↓
Cek apakah sudah absen hari ini
        ↓
Jika belum → simpan absensi
        ↓
Tampilkan status + suara
4.4 Flow Dashboard Statistik
User membuka dashboard
        ↓
Dashboard membaca data attendance
        ↓
Hitung jumlah hadir
        ↓
Hitung persentase
        ↓
Tampilkan grafik
4.5 Flow Laporan Absensi
Admin membuka halaman laporan
        ↓
Pilih kelas
        ↓
Pilih tanggal mulai
        ↓
Pilih tanggal akhir
        ↓
Sistem membaca data attendance
        ↓
Sistem membuat tabel matriks
5. Format Laporan Profesional (MVP)
Header Laporan
LAPORAN ABSENSI SISWA

Kelas   : 10A
Periode : 01 Mar 2026 - 05 Mar 2026
Tabel Laporan
No	Nama	01	02	03	04	05	%
1	Budi	H	H	A	H	H	80%
2	Siti	H	H	H	H	H	100%
6. Rekap Persentase Kehadiran

Rumus:

Persentase = (Jumlah Hadir / Total Hari) × 100%

Contoh:

Hadir = 4
Total hari = 5

Persentase = 80%
7. Highlight Kehadiran Rendah

Jika kehadiran kurang dari 75%, sistem memberi tanda.

Contoh:

Nama	Persentase
Rudi	🔴 60%

Implementasi:

warna merah

icon warning

8. Print Layout Laporan

Admin dapat mencetak laporan.

Flow:

Admin klik tombol Print
        ↓
Browser membuka print layout
        ↓
Laporan dicetak

Gunakan CSS:

@media print
9. Export Laporan ke Excel

MVP dapat menggunakan SheetJS (xlsx library).

Flow:

Admin klik Export Excel
        ↓
Data tabel diubah menjadi file Excel
        ↓
File diunduh
10. Core Features (MVP)
10.1 Authentication System

Fitur login sederhana.

Fungsi:

login admin

login operator

session sederhana

10.2 Student Data Import

Upload CSV siswa.

Fitur:

parse CSV

simpan ke Local Storage

10.3 QR Scanner

Scan QR Code menggunakan kamera.

Library:

html5-qrcode
10.4 Attendance Recording

Mencatat absensi siswa.

Data yang disimpan:

nis
tanggal
waktu
10.5 Attendance Notification

Feedback setelah scan.

Contoh:

✔ Berhasil Absen
Nama : Budi
Kelas : 10A

Disertai notifikasi suara.

10.6 Dashboard Statistik

Menampilkan:

total siswa

jumlah hadir

persentase hadir

grafik

10.7 Attendance Report Matrix

Laporan matriks kehadiran.

Fitur:

filter kelas

filter range tanggal

tabel kehadiran

10.8 Attendance Percentage Summary

Menampilkan persentase hadir tiap siswa.

10.9 Low Attendance Highlight

Menandai siswa dengan kehadiran rendah.

10.10 Print & Export Report

Fitur laporan profesional.

Kemampuan:

print layout

export Excel