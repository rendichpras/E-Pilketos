# Panduan Panitia E-Pilketos

Pengguna: Admin / Panitia Pemilihan

---

## Tujuan Sistem

- Melaksanakan pemilihan Ketua dan Wakil Ketua OSIS secara online.
- Setiap pemilih menggunakan satu token unik untuk memberikan satu suara.
- Identitas siswa tidak dicatat di sistem, hanya token yang tercatat.

---

## Tugas Panitia di Sistem

Panitia melakukan hal berikut:

1. Menyiapkan data pemilihan.
2. Mengisi data pasangan calon.
3. Menghasilkan dan mencetak token pemilih.
4. Mengawasi jalannya pemilihan.
5. Menutup pemilihan.
6. Melihat dan, jika perlu, mengumumkan hasil.

---

## Persiapan Sebelum Hari H

### Akses admin

1. Pastikan sudah memiliki akun admin (username dan password).
2. Buka halaman login admin:  
   `http://ALAMAT-SISTEM/admin/login`
3. Login menggunakan akun admin yang diberikan.

### Membuat pemilihan

1. Setelah login, buka menu **Pemilihan**.
2. Tambah pemilihan baru.
3. Isi:
   - Nama pemilihan.
   - Deskripsi singkat.
   - Tanggal & jam mulai.
   - Tanggal & jam selesai.
   - Status apakah hasil akan ditampilkan ke publik.
4. Simpan pemilihan. Status awal biasanya masih **DRAFT**.

### Mengisi data kandidat

1. Buka menu **Kandidat**.
2. Pilih pemilihan yang sudah dibuat.
3. Tambahkan pasangan calon:
   - Nomor urut.
   - Nama singkat pasangan calon.
   - Nama & kelas Ketua.
   - Nama & kelas Wakil.
   - Visi.
   - Misi.
   - Program kerja utama.
4. Tambahkan semua pasangan calon yang ikut pemilihan.
5. Cek kembali data sebelum hari H.

### Membuat token pemilih

1. Buka menu **Token**.
2. Pilih pemilihan yang akan berjalan.
3. Isi jumlah token yang akan dibuat (sesuai jumlah pemilih).
4. Isi label batch jika ingin mengelompokkan (misal: “Kelas X”, “Kelas XI”).
5. Jalankan proses generate token.
6. Pastikan token muncul di tabel token.

### Mencetak token

1. Masih di menu **Token**, pastikan pemilihan yang dipilih benar.
2. Klik tombol **Tampilan cetak**.
3. Halaman akan menampilkan token dalam bentuk kartu.
4. Gunakan fitur cetak browser (Ctrl+P) untuk mencetak.
5. Potong kartu token dan simpan per kelompok pemilih.

---

## Pelaksanaan Hari H

### Mengaktifkan pemilihan

1. Buka menu **Pemilihan**.
2. Pilih pemilihan yang akan berlangsung.
3. Ubah status pemilihan menjadi **ACTIVE**.
4. Pastikan hanya ada satu pemilihan yang berstatus aktif.

### Membagikan token

1. Bagikan kartu token ke siswa sesuai daftar pemilih.
2. Ingatkan siswa:
   - Token bersifat rahasia.
   - Satu token hanya untuk satu kali voting.
   - Token tidak boleh difoto/disebar ke orang lain.

### Mengawasi proses voting

1. Arahkan pemilih membuka halaman utama E-Pilketos.
2. Minta mereka memilih menu **Mulai Memilih**.
3. Pastikan pemilih:
   - Mengisi token dengan benar.
   - Tidak saling meminjamkan token.
4. Jika ada token rusak/hilang/tersebar:
   - Buka menu **Token**.
   - Cari token tersebut.
   - Ubah status token menjadi batal (invalid).

---

## Setelah Waktu Pemilihan Berakhir

### Menutup pemilihan

1. Buka menu **Pemilihan**.
2. Pilih pemilihan yang sudah selesai waktunya.
3. Ubah status menjadi **CLOSED**.
4. Setelah status ini, pemilih tidak bisa lagi menggunakan token.

### Melihat hasil

1. Buka menu **Hasil**.
2. Pilih pemilihan yang ingin dilihat.
3. Perhatikan:
   - Total token yang dibuat.
   - Token yang digunakan.
   - Token yang belum digunakan.
   - Token yang dibatalkan.
   - Jumlah suara per pasangan calon.
   - Persentase suara masing-masing pasangan.

### Membuka hasil ke publik

1. Jika hasil ingin dilihat seluruh siswa:
   - Buka menu **Pemilihan**.
   - Aktifkan pengaturan bahwa hasil dapat dilihat publik untuk pemilihan itu.
2. Siswa dapat membuka halaman **Hasil** di sisi publik untuk melihat rekap.

---

## Hal yang Perlu Dijaga oleh Panitia

- Jangan membagikan akun admin ke pihak yang tidak berkepentingan.
- Jangan mengubah data pemilihan atau kandidat di tengah pemilihan tanpa alasan jelas.
- Simpan backup database dan dokumentasi hasil setelah pemilihan selesai.
- Jaga kerahasiaan token dan hasil sebelum waktu pengumuman.
