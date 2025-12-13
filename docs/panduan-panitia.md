# Panduan Panitia E-Pilketos

Pengguna: Admin / Panitia Pemilihan

---

## Tujuan Sistem

- Pemilihan Ketua dan Wakil Ketua OSIS secara online.
- Setiap pemilih menggunakan satu token unik untuk memberikan satu suara.
- Identitas siswa tidak dicatat di sistem.

---

## Peran dan Hak Akses

Role admin:

- `SUPER_ADMIN`: bisa mengaktifkan/menutup pemilihan, publish/hide hasil, generate/invalidate token.
- `COMMITTEE`: akses admin umum; aksi kritikal dibatasi.

Jika akun panitia bukan `SUPER_ADMIN`, minta akses `SUPER_ADMIN` untuk melakukan langkah yang membutuhkan hak tersebut.

---

## Aturan Penting (Wajib Dipahami)

1. Perubahan data hanya saat `DRAFT`

- Kandidat hanya bisa tambah/ubah/hapus saat pemilihan `DRAFT`.
- Token hanya bisa generate/invalidate saat pemilihan `DRAFT`.

2. Saat `ACTIVE` (voting berjalan)

- Kandidat terkunci.
- Token terkunci (tidak bisa generate/invalidate).
- Jika ada masalah distribusi token, gunakan token cadangan yang sudah dibuat saat `DRAFT`.

3. Publikasi hasil hanya setelah `CLOSED`

- Publish/Hide hasil hanya bisa dilakukan saat pemilihan `CLOSED` (oleh `SUPER_ADMIN`).

---

## Persiapan Sebelum Hari H (Status `DRAFT`)

### Login admin

1. Buka:
   `http://ALAMAT-SISTEM/admin/login`
2. Login menggunakan akun admin.

### Membuat pemilihan

1. Buka menu **Pemilihan**.
2. Tambah pemilihan baru.
3. Isi:
   - Nama pemilihan
   - Deskripsi
   - Tanggal & jam mulai (`startAt`)
   - Tanggal & jam selesai (`endAt`)
4. Simpan. Status awal `DRAFT`.

Catatan: sistem hanya bisa mengaktifkan pemilihan jika waktu saat ini berada dalam jendela `startAt`–`endAt`.

### Mengisi data kandidat

1. Buka menu **Kandidat**.
2. Pilih pemilihan (pastikan status `DRAFT`).
3. Tambah pasangan calon:
   - Nomor urut
   - Nama singkat paslon
   - Nama & kelas Ketua
   - Nama & kelas Wakil
   - Visi, misi, program kerja
4. Pastikan semua kandidat sudah benar sebelum Hari H.

### Membuat token pemilih (hanya `SUPER_ADMIN`)

1. Buka menu **Token**.
2. Pilih pemilihan (status harus `DRAFT`).
3. Isi jumlah token sesuai jumlah pemilih + token cadangan.
4. Isi label batch jika diperlukan (contoh: per kelas/angkatan).
5. Generate token.

Catatan: token yang sudah `USED/INVALIDATED` nilainya disamarkan dan tidak akan menampilkan token asli.

### Cetak token (PDF)

1. Buka menu **Token**.
2. Pastikan filter status `UNUSED`.
3. Gunakan tombol/aksi **Download PDF** (mengarah ke `/admin/tokens/print-pdf`).
4. Cetak PDF dan distribusikan token.

---

## Pelaksanaan Hari H

### Mengaktifkan pemilihan (hanya `SUPER_ADMIN`)

1. Buka menu **Pemilihan**.
2. Pilih pemilihan yang akan berlangsung (pastikan status `DRAFT`).
3. Jalankan aksi **Aktifkan**.
4. Pastikan status berubah menjadi `ACTIVE`.

Catatan: saat pemilihan ini diaktifkan, sistem otomatis menutup pemilihan lain yang sedang `ACTIVE` (jika ada).

### Membagikan token

1. Bagikan token ke siswa sesuai daftar pemilih.
2. Ingatkan siswa:
   - Token rahasia, tidak boleh difoto/disebar.
   - Token hanya untuk satu kali memilih.

### Mengawasi proses voting

- Arahkan siswa membuka `/vote` dan memasukkan token.
- Jika token ditolak:
  - token salah format / salah ketik
  - token sudah digunakan
  - token sudah dibatalkan
  - pemilihan tidak sedang `ACTIVE` atau di luar jadwal

---

## Setelah Waktu Pemilihan Berakhir

### Menutup pemilihan (hanya `SUPER_ADMIN`)

Metode manual:

1. Buka menu **Pemilihan**.
2. Pilih pemilihan yang selesai.
3. Jalankan aksi **Tutup** (status menjadi `CLOSED`).

Metode otomatis (server job):

- Jalankan script auto-close di server sesuai jadwal operasional.

### Melihat hasil (admin)

1. Buka menu **Hasil**.
2. Pilih pemilihan.
3. Perhatikan rekap suara dan statistik token.

### Publish hasil ke publik (hanya `SUPER_ADMIN`, status harus `CLOSED`)

1. Buka menu **Pemilihan**.
2. Pada pemilihan `CLOSED`, jalankan aksi **Publikasikan hasil**.
3. Publik dapat melihat hasil di `/results`.

Untuk menutup kembali akses publik:

- Jalankan aksi **Sembunyikan hasil** (tetap hanya saat `CLOSED`).

---

## Hal yang Wajib Dijaga oleh Panitia

- Akun admin hanya untuk panitia yang berwenang.
- Jangan mengaktifkan pemilihan sebelum waktu `startAt`.
- Pastikan token dan kandidat final sebelum pemilihan diaktifkan.
- Simpan backup database setelah pemilihan selesai.
- Jaga kerahasiaan token dan hasil sebelum pengumuman resmi.
