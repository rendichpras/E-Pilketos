# E-Pilketos

Sistem e-voting untuk pemilihan Ketua dan Wakil Ketua OSIS dengan token anonim.

## Quick Start

```bash
# install dependencies
pnpm install

# setup database
pnpm db:generate && pnpm db:migrate

# buat akun admin pertama
pnpm seed:admin

# jalankan development server
pnpm dev
```

Buka `http://localhost:3000` untuk frontend dan `http://localhost:4000/api/v1/health` untuk API.

---

## Tentang Proyek

E-Pilketos dibangun dengan prinsip anonymous voting:

- Tidak ada data identitas pemilih yang disimpan
- Akses voting pakai token sekali pakai (format: `ABCD-1234`)
- Token yang sudah dipakai di-redact supaya tidak bisa dilacak

### Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind
- **Backend:** Hono, Drizzle ORM
- **Database:** PostgreSQL
- **Cache:** Redis (untuk rate limiting)

---

## Konfigurasi

### Backend (apps/api/.env)

```env
# wajib
DATABASE_URL=postgresql://user:pass@localhost:5432/pilketos

# opsional di development
PORT=4000
CORS_ORIGIN=http://localhost:3000

# session
ADMIN_SESSION_TTL_SEC=28800
VOTER_SESSION_TTL_SEC=7200
```

**Production checklist:**

- `CORS_ORIGIN` wajib diisi (bukan `*`)
- `REDIS_URL` wajib untuk rate limiting
- `COOKIE_SECURE=true` kalau pakai HTTPS

### Frontend (apps/web/.env)

```env
NEXT_PUBLIC_API_URL=/api/v1
API_URL=http://localhost:4000/api/v1
```

---

## Database

Jalankan migration:

```bash
pnpm db:generate   # generate migration files
pnpm db:migrate    # apply ke database
```

### Status Election

| Status | Keterangan |
|--------|------------|
| DRAFT | Masih disiapkan, bisa edit bebas |
| ACTIVE | Sedang berlangsung, hanya boleh 1 |
| CLOSED | Selesai, hasil bisa dipublish |
| ARCHIVED | Diarsipkan |

### Status Token

| Status | Keterangan |
|--------|------------|
| UNUSED | Belum dipakai |
| USED | Sudah voting |
| INVALIDATED | Dibatalkan admin |

---

## Alur Kerja

### Admin

1. Login di `/admin`
2. Buat pemilihan baru (DRAFT)
3. Tambah pasangan calon
4. Generate token
5. Cetak/bagikan token ke pemilih
6. Aktifkan pemilihan
7. Tutup setelah selesai
8. Publish hasil kalau perlu

### Pemilih

1. Dapat token dari panitia
2. Buka `/vote`
3. Masukkan token
4. Pilih kandidat
5. Konfirmasi
6. Selesai

---

## Role Admin

| Role | Akses |
|------|-------|
| SUPER_ADMIN | Semua, termasuk activate/close election, generate token |
| COMMITTEE | CRUD biasa, tidak bisa aksi kritikal |

---

## API

Base: `/api/v1`

### Auth

```
POST /admin/auth/login     - login admin
POST /admin/auth/logout    - logout admin
GET  /admin/auth/me        - cek session

POST /auth/token-login     - login pakai token
POST /auth/token-logout    - logout voter
```

### Elections

```
GET    /admin/elections           - list semua
POST   /admin/elections           - buat baru
GET    /admin/elections/:id       - detail
PUT    /admin/elections/:id       - update
POST   /admin/elections/:id/activate      - aktifkan (SUPER_ADMIN)
POST   /admin/elections/:id/close         - tutup (SUPER_ADMIN)
POST   /admin/elections/:id/publish-results   - publish hasil
POST   /admin/elections/:id/hide-results      - hide hasil

GET    /public/elections/active   - election aktif
GET    /public/elections/latest   - election terbaru
```

### Candidates

```
GET    /admin/candidates/election/:electionId   - list kandidat
POST   /admin/candidates/election/:electionId   - tambah
PUT    /admin/candidates/:id                    - update
DELETE /admin/candidates/:id                    - hapus

GET    /public/candidates   - kandidat publik
```

### Tokens

```
GET   /admin/tokens/:electionId           - list (SUPER_ADMIN)
POST  /admin/tokens/generate/:electionId  - generate (SUPER_ADMIN)
POST  /admin/tokens/invalidate/:id        - invalidate (SUPER_ADMIN)
```

### Voting

```
GET  /voter/candidates   - kandidat untuk voting
POST /voter/vote         - submit suara
```

### Results

```
GET /admin/results/:electionId   - hasil lengkap + statistik token
GET /public/results              - hasil publik (kalau sudah dipublish)
```

### Health

```
GET /health        - status basic
GET /health/ready  - cek koneksi DB
GET /health/live   - liveness probe
```

### Response Format

```json
// sukses
{ "ok": true, "data": { ... } }

// error
{ "ok": false, "error": "pesan", "code": "ERROR_CODE" }
```

---

## Struktur Folder

```
apps/
  api/src/
    core/         - error classes, middleware, response helpers
    features/     - auth, elections, candidates, tokens, voting, health
    db/           - schema drizzle
    scripts/      - maintenance scripts
  web/src/
    app/          - pages (Next.js App Router)
    components/   - UI components
    lib/          - utilities, api clients

packages/
  types/          - shared TypeScript types
  validators/     - shared Zod schemas
```

---

## Dokumentasi Lain

- [API Reference](docs/api.md) - detail lengkap semua endpoint
- [Struktur Proyek](docs/structure.md) - penjelasan arsitektur
- [Panduan Panitia](docs/panduan-panitia.md)
- [Panduan Pemilih](docs/panduan-pemilih.md)

---

## License

MIT License — lihat file [LICENSE](LICENSE).
