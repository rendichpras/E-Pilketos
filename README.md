# E-Pilketos

Sistem Pemilihan Ketua & Wakil Ketua OSIS Berbasis Web

---

## Gambaran Umum

E-Pilketos adalah aplikasi e-voting untuk pemilihan Ketua & Wakil Ketua OSIS yang dirancang dengan prinsip:

- Pemilih tetap anonim (tidak ada NIS/nama/kelas tersimpan di sistem).
- Akses pemilih menggunakan **token unik sekali pakai** (format `XXXX-YYYY`).
- Satu token hanya bisa dipakai **satu kali** untuk memberikan suara.
- Panitia mengatur semuanya dari panel admin; siswa cukup membuka halaman voting dan memasukkan token.

Aplikasi ini terdiri dari:

- Frontend: Next.js + Tailwind CSS
- Backend API: Hono + Drizzle ORM
- Database: PostgreSQL

---

## Fitur

### Pemilih

- Masuk dengan token di `/vote`.
- Melihat daftar pasangan calon pada pemilihan yang aktif.
- Memilih satu pasangan calon.
- Setelah memilih, token langsung kadaluarsa (`USED`) dan tidak dapat dipakai lagi.
- Mendapat halaman konfirmasi di `/vote/sukses`.

### Admin / Panitia

Panel admin menggunakan prefix `/admin/*`:

- Login admin di `/admin/login`.
- Dashboard ringkas di `/admin/dashboard`.

Menu utama:

1. **Pemilihan** (`/admin/elections`)
   - Membuat dan mengubah pemilihan.
   - Mengatur periode (mulai–selesai).
   - Mengatur status:
     - `DRAFT` – disiapkan, belum bisa dipilih.
     - `ACTIVE` – sedang berjalan (hanya boleh satu yang aktif).
     - `CLOSED` – selesai, tidak bisa voting lagi.
     - `ARCHIVED` – arsip jangka panjang.
   - Menandai apakah hasil boleh dibuka ke publik (`isResultPublic`).

2. **Kandidat** (`/admin/candidates`)
   - Memilih pemilihan yang aktif / terkait.
   - Mengelola pasangan calon:
     - Nomor urut.
     - Nama singkat paslon.
     - Nama & kelas Ketua.
     - Nama & kelas Wakil.
     - Foto (URL).
     - Visi, misi, dan program kerja.
   - Mengaktifkan/nonaktifkan pasangan calon.

3. **Token** (`/admin/tokens`)
   - Memilih pemilihan.
   - Menghasilkan token dalam jumlah tertentu.
   - Memberi label batch (misal per angkatan atau kelompok).
   - Melihat daftar token per pemilihan:
     - `UNUSED` – belum dipakai.
     - `USED` – sudah dipakai.
     - `INVALIDATED` – dibatalkan.
   - Meng-invalidasi token.
   - Mengunduh token (halaman yang sedang dibuka) dalam format CSV.
   - Membuka tampilan cetak token (`/admin/tokens/print`).

4. **Cetak Token** (`/admin/tokens/print`)
   - Menampilkan token `UNUSED` dalam bentuk kartu grid.
   - Filter berdasarkan batch.
   - Siap dicetak (Ctrl+P), lalu dipotong dan dibagikan.

5. **Hasil** (`/admin/results`)
   - Ringkasan token:
     - Total token.
     - Token digunakan.
     - Token belum digunakan.
     - Token di-invalidasi.
   - Ringkasan suara:
     - Total suara sah.
     - Suara per pasangan calon.
     - Persentase per pasangan calon dengan bar chart sederhana.

### Publik

- `/` – landing E-Pilketos.
- `/candidates` – daftar pasangan calon dari pemilihan aktif.
- `/results` – hasil pemilihan yang sudah selesai dan ditandai sebagai publik.

---

## 3. Arsitektur Singkat

### Frontend

- Next.js App Router menggunakan folder `app/`.
- Styling dengan Tailwind CSS.
- Komponen UI dasar di `components/ui/` (Button, Input, Textarea, dsb.).
- Komunikasi dengan backend melalui `lib/api-client.ts` yang membaca `NEXT_PUBLIC_API_URL`.
- Layout admin (`app/admin/layout.tsx`) melakukan cek sesi admin via endpoint `/admin/auth/me`.
- Error handling:
  - `app/error.tsx` – error global.
  - `app/not-found.tsx` – 404 global.
  - `app/admin/error.tsx` – error khusus area admin.

### Backend

- Hono sebagai HTTP server (API).
- Drizzle ORM untuk akses PostgreSQL.
- JWT untuk:
  - Admin (sesi login panel admin).
  - Voter (sesi yang terikat dengan satu token pemilih).
- Struktur rute dibagi tiga:
  - Rute admin (`/admin/...`).
  - Rute voter (`/auth/token-login`, `/voter/...`).
  - Rute publik (`/public/...`).

---

## Persyaratan

- Bun `^1.x`
- PostgreSQL `>= 13`
- Git
- Sistem operasi yang pernah diuji:
  - Windows 10/11
  - Linux (Ubuntu 22.04)
  - macOS versi modern

---

## Instalasi

1. Clone repository:

   ```bash
   git clone <URL_REPO> e-pilketos
   cd e-pilketos
   ```

2. Install dependency:

   ```bash
   bun install
   ```

---

## Konfigurasi Environment

Buat file `.env` di root proyek:

```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/e_pilketos

# Backend (Hono API)
NODE_ENV=development
PORT=4000
JWT_SECRET_ADMIN=ganti-dengan-string-random-panjang-admin
JWT_SECRET_VOTER=ganti-dengan-string-random-panjang-voter
CORS_ORIGIN=http://localhost:3000

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Hal yang perlu diperhatikan:

- `DATABASE_URL` mengarah ke database yang sudah dibuat.
- `JWT_SECRET_ADMIN` dan `JWT_SECRET_VOTER` harus string acak yang panjang.
- `CORS_ORIGIN` berisi origin frontend (saat dev: `http://localhost:3000`).
- `NEXT_PUBLIC_API_URL` berisi base URL API backend.

Pastikan `drizzle.config.ts` menggunakan `process.env.DATABASE_URL` pada `dbCredentials.url`.

---

## Migrasi Database

Jalankan migrasi Drizzle:

```bash
bun run db:generate
bun run db:migrate
```

Setelah ini, schema database sesuai dengan definisi Drizzle di backend.

---

## Menjalankan Aplikasi (Development)

### Backend (Hono API)

Jalankan server backend:

```bash
bun run dev:be
```

API akan tersedia di `http://localhost:4000`.

### Frontend (Next.js)

Jalankan frontend:

```bash
bun run dev
```

Aplikasi web tersedia di `http://localhost:3000`.

### Rute Penting untuk Uji Manual

- `http://localhost:3000/` – landing.
- `http://localhost:3000/admin/login` – login admin.
- `http://localhost:3000/admin/elections` – kelola pemilihan.
- `http://localhost:3000/admin/candidates` – kelola kandidat.
- `http://localhost:3000/admin/tokens` – generate dan kelola token.
- `http://localhost:3000/admin/tokens/print?electionId=<ID>` – tampilan cetak token.
- `http://localhost:3000/vote` – uji flow voting dengan token.
- `http://localhost:3000/admin/results` – rekap hasil.
- `http://localhost:3000/results` – hasil publik.

---

## Alur Penggunaan

### Dari Sisi Admin

1. Login admin di `/admin/login`.
2. Buka menu **Pemilihan**:
   - Buat pemilihan baru dan isi data.
   - Atur status menjadi `ACTIVE` saat hari H.

3. Buka menu **Kandidat**:
   - Pilih pemilihan yang akan diisi.
   - Tambah pasangan calon (lengkap dengan visi, misi, program).

4. Buka menu **Token**:
   - Pilih pemilihan.
   - Generate token sesuai jumlah pemilih.
   - Jika perlu, beri label batch (misal per angkatan).

5. Buka **Tampilan cetak**:
   - Cetak token.
   - Potong dan bagikan ke siswa.

6. Setelah pemilihan selesai:
   - Ubah status pemilihan menjadi `CLOSED`.
   - Buka menu **Hasil** untuk melihat rekap.
   - Jika hasil akan dibuka ke publik, pastikan `isResultPublic = true`.
   - Publik bisa melihat hasil di `/results`.

### Dari Sisi Siswa (Pemilih)

1. Menerima token dari panitia.
2. Membuka `/vote`.
3. Mengisi token.
4. Jika token valid dan pemilihan sedang `ACTIVE`:
   - Sistem membuat sesi voter.
   - Siswa diarahkan ke `/vote/pilih`.
   - Siswa memilih satu pasangan calon dan mengonfirmasi.

5. Setelah itu:
   - Token berubah menjadi `USED`.
   - Siswa diarahkan ke `/vote/sukses`.

---

## Ringkasan Endpoint API

Semua endpoint berada di bawah prefix `/api/v1`.

### Admin Auth

- `POST /admin/auth/login`
  Login admin, men-set cookie sesi.

- `GET /admin/auth/me`
  Mendapatkan informasi admin dari sesi.

- `POST /admin/auth/logout`
  Logout admin.

### Elections

- `GET /admin/elections`
- `POST /admin/elections`
- `PUT /admin/elections/:id`
- `POST /admin/elections/:id/activate`
- `POST /admin/elections/:id/close`

### Candidates

- `GET /admin/candidates/election/:electionId`
- `POST /admin/candidates/election/:electionId`
- `PUT /admin/candidates/:id`
- `DELETE /admin/candidates/:id`

### Tokens

- `GET /admin/tokens/:electionId`
  Query: `page`, `limit`, `status`, `batch`.

- `POST /admin/tokens/generate/:electionId`
  Body: `{ count, batchLabel }`.

- `POST /admin/tokens/invalidate/:tokenId`

### Results (Admin)

- `GET /admin/results/:electionId`

### Voter

- `POST /auth/token-login`
  Body: `{ token }`.

- `GET /voter/candidates`

- `POST /voter/vote`
  Body: `{ candidatePairId }`.

### Public

- `GET /public/elections/active`
- `GET /public/candidates`
- `GET /public/results`

---

## Skema Data (Konseptual)

### `elections`

- `id`
- `slug`
- `name`
- `description`
- `start_at`
- `end_at`
- `status`
- `is_result_public`
- `created_at`
- `updated_at`

### `candidate_pairs`

- `id`
- `election_id`
- `number`
- `short_name`
- `ketua_name`
- `ketua_class`
- `wakil_name`
- `wakil_class`
- `photo_url`
- `vision`
- `mission`
- `programs`
- `is_active`
- `created_at`
- `updated_at`

### `tokens`

- `id`
- `election_id`
- `token`
- `status`
- `generated_batch`
- `used_at`
- `invalidated_at`
- `created_at`

### `votes`

- `id`
- `election_id`
- `token_id`
- `candidate_pair_id`
- `created_at`

### `admin_users`

- `id`
- `username`
- `password_hash`
- `role`
- `created_at`

---

## Keamanan dan Privasi

- Sistem tidak menyimpan identitas siswa (tidak ada NIS, nama, atau kelas pemilih).
- Token hanya berfungsi sebagai kunci teknis untuk satu kali voting.
- Setelah vote, token berubah menjadi `USED` dan tidak dapat digunakan ulang.
- Password admin disimpan sebagai hash.
- Sesi admin dan voter menggunakan JWT via cookie.
- Di environment produksi, aplikasi sebaiknya berjalan di belakang HTTPS.

---

## Deployment Singkat (Production)

1. Siapkan PostgreSQL dan database untuk production.

2. Isi `.env` production dengan:
   - `DATABASE_URL` ke DB production.
   - `NODE_ENV=production`.
   - Secret JWT yang kuat.
   - `CORS_ORIGIN` ke domain frontend.
   - `NEXT_PUBLIC_API_URL` ke domain API.

3. Jalankan migrasi Drizzle di server production.

4. Jalankan backend Hono dengan script non-dev, misalnya:

   ```bash
   bun run start:be
   ```

5. Build dan jalankan frontend:

   ```bash
   bun run build
   bun run start
   ```

6. Letakkan keduanya di belakang reverse proxy (Nginx/Caddy) dan aktifkan HTTPS.

---

## Lisensi

Proyek ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.
