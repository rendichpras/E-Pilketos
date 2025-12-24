# E-Pilketos

Sistem Pemilihan Ketua & Wakil Ketua OSIS berbasis web dengan token sekali pakai (anonim).

Dokumentasi pengguna:

- Panitia/Admin: `docs/panduan-panitia.md`
- Pemilih/Siswa: `docs/panduan-pemilih.md`

---

## Gambaran Umum

E-Pilketos dirancang dengan prinsip:

- Identitas pemilih tidak disimpan (tidak ada NIS/nama/kelas di database).
- Akses pemilih menggunakan **token unik sekali pakai** (format `XXXX-YYYY`).
- Satu token hanya bisa dipakai **sekali** untuk memberikan suara.
- Setelah dipakai, token akan berubah status menjadi `USED` dan nilainya **disamarkan** (redacted).
- Panitia mengatur pemilihan dari panel admin; pemilih cukup membuka halaman voting dan memasukkan token.

Stack:

- Frontend: Next.js (App Router) + Tailwind
- Backend API: Hono + Drizzle ORM
- Database: PostgreSQL
- Redis: untuk rate limit pada mode production (multi-instance)

---

## Fitur

### Pemilih

- Masuk dengan token di `/vote`.
- Sistem hanya menerima token yang:
  - status `UNUSED`
  - pemilihan berstatus `ACTIVE`
  - waktu saat ini berada di antara `startAt` dan `endAt`
- Melihat daftar pasangan calon yang aktif.
- Memilih satu pasangan calon.
- Setelah memilih:
  - token menjadi `USED`
  - sesi pemilih dihapus
  - pemilih diarahkan ke `/vote/sukses`

### Admin / Panitia (Panel `/admin/*`)

1. **Pemilihan** (`/admin/elections`)

- Membuat pemilihan (status awal `DRAFT`).
- Mengubah nama/deskripsi.
- Mengubah jadwal (`startAt`, `endAt`) **hanya saat `DRAFT`**.
- Mengaktifkan pemilihan (`DRAFT` → `ACTIVE`) **hanya SUPER_ADMIN** dan hanya jika waktu saat ini berada dalam jendela jadwal.
- Menutup pemilihan (`ACTIVE` → `CLOSED`) **hanya SUPER_ADMIN**.
- Saat mengaktifkan sebuah pemilihan, sistem otomatis menutup pemilihan lain yang sedang `ACTIVE` (menjaga hanya 1 ACTIVE).

2. **Publikasi hasil** (aksi di halaman Pemilihan)

- `Publish results` / `Hide results` **hanya SUPER_ADMIN** dan **hanya saat pemilihan `CLOSED`**.
- Pengaturan hasil publik tidak bisa diubah dari form edit election; harus lewat endpoint publish/hide khusus.

3. **Kandidat** (`/admin/candidates`)

- CRUD kandidat **hanya saat pemilihan `DRAFT`**.
- Toggle aktif/nonaktif kandidat **hanya saat pemilihan `DRAFT`**.
- Saat `ACTIVE/CLOSED`, semua aksi kandidat terkunci.

4. **Token** (`/admin/tokens`)

- Generate token **hanya saat pemilihan `DRAFT`** dan **hanya SUPER_ADMIN**.
- Invalidate token **hanya saat pemilihan `DRAFT`**, **hanya SUPER_ADMIN**, dan hanya untuk token yang belum dipakai (`UNUSED`).
- Token `USED/INVALIDATED` akan disamarkan (nilai token berubah menjadi prefix `USED-...` / `INV-...`), sehingga hanya token `UNUSED` yang menampilkan nilai token asli.
- Export/Copy/Print difokuskan untuk token `UNUSED`.

5. **Cetak Token (PDF)** (`/admin/tokens/print-pdf`)

- Endpoint Next.js untuk membuat file PDF token.
- Hard-lock: hanya bisa membuat PDF untuk token `UNUSED`.
- Mendukung filter batch via query `batch`.
- Membutuhkan sesi admin (cookie) karena mengambil data token dari API admin.

6. **Hasil (Admin)** (`/admin/results`)

- Rekap suara dan statistik token per pemilihan (akses admin).
- Publik hanya bisa melihat hasil jika sudah dipublish.

---

## Peran & Hak Akses (RBAC)

Role admin:

- `SUPER_ADMIN` (aksi kritikal)
- `COMMITTEE` (akses admin umum; aksi kritikal dibatasi)

Aksi yang dibatasi `SUPER_ADMIN`:

- Activate election
- Close election
- Publish/Hide results
- Generate token
- Invalidate token

---

## Rute Penting (Frontend)

- `/` — landing
- `/vote` — login token pemilih
- `/vote/pilih` — pilih kandidat
- `/vote/sukses` — sukses
- `/candidates` — daftar kandidat dari pemilihan aktif
- `/results` — hasil publik (hanya jika dipublish)

Admin:

- `/admin/login`
- `/admin/dashboard`
- `/admin/elections`
- `/admin/candidates`
- `/admin/tokens`
- `/admin/results`

Cetak token PDF:

- `/admin/tokens/print-pdf?electionId=<ID>&batch=<label>&max=<n>`

---

## Arsitektur Singkat

### Frontend (Next.js)

- App Router di `apps/web/src/app/`.
- UI components di `apps/web/src/components/ui/`.
- Akses API via `apps/web/src/lib/api-client.ts` (menggunakan `NEXT_PUBLIC_API_URL`).
- Admin layout mengecek sesi admin via `GET /api/v1/admin/auth/me`.

### Backend (Hono)

- Base path: `/api/v1`
- Route handlers ada di `apps/api/src/routes/` (mis. `adminAuth.ts`, `elections.ts`, dst.).
- Endpoint:
  - `/admin/auth`, `/admin/elections`, `/admin/candidates`, `/admin/tokens`, `/admin/results`
  - `/auth` (voter token login/logout)
  - `/voter` (candidate list dan vote)
  - `/public/*` (akses publik)

---

## Persyaratan

- Bun `^1.x`
- PostgreSQL `>= 13`
- Redis (wajib untuk production multi-instance; dev bisa tanpa Redis)

---

## Instalasi (Development)

1. Install dependency (root workspace):

```bash
bun install
```

2. Buat `.env` untuk masing-masing app:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Isi variabel penting minimal:

- `apps/api/.env`: `DATABASE_URL`, `CORS_ORIGIN`
- `apps/web/.env`: `NEXT_PUBLIC_API_URL`

4. Migrasi database (dari root):

```bash
bun run db:generate
bun run db:migrate
```

5. Jalankan API + Web bersamaan:

```bash
bun run dev
```

Alternatif:
- hanya API: `bun run dev:api`
- hanya Web: `bun run dev:web`

---

## Environment Variables

Lihat `.env.example` untuk daftar lengkap. Variabel utama:

### Database

- `DATABASE_URL`

### Backend

- `NODE_ENV` (`development|test|production`)
- `PORT`

### CORS

- `CORS_ORIGIN` (comma-separated origin; wajib di production, tidak boleh `*`)

### Cookie

- `COOKIE_DOMAIN` (kosong untuk localhost; isi domain untuk production jika diperlukan)
- `COOKIE_SAMESITE` (`Lax|Strict|None`)
- `COOKIE_SECURE` (`true/false`, default true di production)

### Session TTL (detik)

- `ADMIN_SESSION_TTL_SEC`
- `VOTER_SESSION_TTL_SEC`

### Redis (rate limit)

- `REDIS_URL` (wajib di production)
- `RATE_LIMIT_REDIS_PREFIX`

### Rate limit

- `RATE_LIMIT_LOGIN_WINDOW_SEC`, `RATE_LIMIT_LOGIN_MAX`
- `RATE_LIMIT_TOKEN_LOGIN_WINDOW_SEC`, `RATE_LIMIT_TOKEN_LOGIN_MAX`
- `RATE_LIMIT_VOTE_WINDOW_SEC`, `RATE_LIMIT_VOTE_MAX`

### Frontend

- `NEXT_PUBLIC_API_URL` (contoh dev: `http://localhost:4000/api/v1`)

---

## Health Check

- `GET /api/v1/health` → status service
- `GET /api/v1/health/ready` → cek DB dan Redis (503 jika tidak ready)

---

## Jobs / Scripts Operasional

Script tersedia di `apps/api/src/scripts/`:

1. Auto close election (menutup election ACTIVE yang melewati `endAt`):

```bash
bun run autoClose:run
```

2. Maintenance (hapus sesi expired + bersihkan token redaction yang belum ter-apply):

```bash
bun run maintenance:run
```

3. Integrity check (gagal exit code 1 jika ada anomali):

```bash
bun run integrity:check
```

4. Seed SUPER_ADMIN (buat akun super admin langsung ke database):

```bash
bun run seed:admin -- <username> <password>
```

(Alternatif: `cd apps/api && bun tsx src/scripts/seed-admin.ts <username> <password>`.)



---

## Alur Operasional (Panitia)

1. Buat election (DRAFT), set jadwal, isi kandidat (DRAFT).
2. Generate token (DRAFT, SUPER_ADMIN), siapkan token cadangan.
3. Download PDF token (UNUSED), cetak, distribusikan.
4. Saat waktu mulai:
   - SUPER_ADMIN mengaktifkan election (DRAFT → ACTIVE).

5. Saat voting berjalan:
   - Kandidat dan token terkunci (tidak bisa generate/invalidate/ubah kandidat).

6. Setelah selesai:
   - SUPER_ADMIN menutup election (ACTIVE → CLOSED) atau jalankan auto-close.

7. Publish hasil (CLOSED, SUPER_ADMIN) jika ingin ditampilkan publik.

---

## Ringkasan Endpoint API

Semua endpoint backend berada di bawah prefix `/api/v1`.

### Admin Auth

- `POST /admin/auth/login`
- `GET /admin/auth/me`
- `POST /admin/auth/logout`

### Elections (Admin)

- `GET /admin/elections`
- `GET /admin/elections/:id`
- `POST /admin/elections`
- `PUT /admin/elections/:id` (jadwal hanya DRAFT; `isResultPublic` ditolak)
- `POST /admin/elections/:id/activate` (SUPER_ADMIN)
- `POST /admin/elections/:id/close` (SUPER_ADMIN)
- `POST /admin/elections/:id/publish-results` (SUPER_ADMIN, hanya CLOSED)
- `POST /admin/elections/:id/hide-results` (SUPER_ADMIN, hanya CLOSED)

### Candidates (Admin)

- `GET /admin/candidates/election/:electionId`
- `POST /admin/candidates/election/:electionId` (hanya DRAFT)
- `PUT /admin/candidates/:id` (hanya DRAFT)
- `DELETE /admin/candidates/:id` (hanya DRAFT)

### Tokens (Admin)

- `GET /admin/tokens/:electionId` (query: `page`, `limit`, `status`, `batch`)
- `POST /admin/tokens/generate/:electionId` (SUPER_ADMIN, hanya DRAFT)
- `POST /admin/tokens/invalidate/:id` (SUPER_ADMIN, hanya DRAFT, token UNUSED)

### Results (Admin)

- `GET /admin/results/:electionId`

### Voter Auth

- `POST /auth/token-login`
- `POST /auth/token-logout`

### Voter

- `GET /voter/candidates`
- `POST /voter/vote`

### Public

- `GET /public/elections/active`
- `GET /public/candidates` (query opsional: `electionSlug`)
- `GET /public/results` (query opsional: `electionSlug`, harus sudah dipublish)

---

## Skema Data (Konseptual)

### `elections`

- `id`, `slug`, `name`, `description`
- `start_at`, `end_at`
- `status` (`DRAFT|ACTIVE|CLOSED|ARCHIVED`)
- `is_result_public`
- `created_at`, `updated_at`

### `candidate_pairs`

- `id`, `election_id`
- `number`, `short_name`
- `ketua_name`, `ketua_class`
- `wakil_name`, `wakil_class`
- `photo_url`, `vision`, `mission`, `programs`
- `is_active`
- `created_at`, `updated_at`

### `tokens`

- `id`, `election_id`
- `token` (nilai asli hanya untuk `UNUSED`; `USED/INVALIDATED` disamarkan)
- `status` (`UNUSED|USED|INVALIDATED`)
- `generated_batch`
- `used_at`, `invalidated_at`, `created_at`

### `votes`

- `id`, `election_id`, `candidate_pair_id`, `created_at`

### `admins`

- `id`, `username`, `password_hash`, `role`, `created_at`, `updated_at`

### `admin_sessions`, `voter_sessions`

- sesi berbasis DB + cookie (`admin_session`, `voter_session`)

### `audit_logs`

- jejak aksi admin dan aksi sistem (mis. auto-close)

---

## Keamanan dan Privasi

- Tidak menyimpan identitas siswa.
- Token dipakai satu kali; setelah dipakai/diinvalidate nilainya disamarkan.
- Password admin disimpan dalam bentuk hash.
- Sesi menggunakan cookie HttpOnly.
- Gunakan HTTPS di production.

---

## Lisensi

MIT License — lihat file [LICENSE](LICENSE).
