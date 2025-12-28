# API Reference

Base URL: `/api/v1`

---

## Response Format

Semua response pakai format ini:

```json
// sukses
{
  "ok": true,
  "data": { ... }
}

// error
{
  "ok": false,
  "error": "Deskripsi error",
  "code": "ERROR_CODE",
  "requestId": "uuid"
}

// dengan pagination
{
  "ok": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Auth

### Login Admin

```
POST /admin/auth/login
```

Body:
```json
{
  "username": "admin",
  "password": "password123"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "username": "admin",
    "role": "SUPER_ADMIN"
  }
}
```

Rate limit: 10 request per 60 detik.

---

### Logout Admin

```
POST /admin/auth/logout
```

---

### Cek Session Admin

```
GET /admin/auth/me
```

Butuh cookie `admin_session`.

---

### Login Voter (Token)

```
POST /auth/token-login
```

Body:
```json
{
  "token": "ABCD-1234"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "electionId": "uuid",
    "electionSlug": "pilketos-2024",
    "electionName": "Pilketos 2024"
  }
}
```

Error codes:
- `TOKEN_INVALID` - token tidak ditemukan
- `TOKEN_USED` - token sudah dipakai
- `ELECTION_INACTIVE` - election tidak aktif

Rate limit: 20 request per 60 detik.

---

### Logout Voter

```
POST /auth/token-logout
```

---

## Elections

### List Elections

```
GET /admin/elections
```

Butuh auth admin.

---

### Create Election

```
POST /admin/elections
```

Body:
```json
{
  "slug": "pilketos-2024",
  "name": "Pilketos 2024",
  "description": "Pemilihan Ketua OSIS",
  "startAt": "2024-01-15T08:00:00Z",
  "endAt": "2024-01-15T15:00:00Z"
}
```

Validasi:
- `slug`: lowercase, alphanumeric + dash, max 64 char
- `startAt` harus sebelum `endAt`

---

### Get Election

```
GET /admin/elections/:id
```

---

### Update Election

```
PUT /admin/elections/:id
```

Body (semua opsional):
```json
{
  "name": "...",
  "description": "...",
  "startAt": "...",
  "endAt": "..."
}
```

Catatan: `startAt` dan `endAt` cuma bisa diubah kalau status masih DRAFT.

---

### Activate Election

```
POST /admin/elections/:id/activate
```

Butuh SUPER_ADMIN. Syarat:
- Status harus DRAFT
- Waktu sekarang harus di antara startAt dan endAt

Kalau ada election lain yang ACTIVE, otomatis di-close.

---

### Close Election

```
POST /admin/elections/:id/close
```

Butuh SUPER_ADMIN. Status harus ACTIVE.

---

### Publish/Hide Results

```
POST /admin/elections/:id/publish-results
POST /admin/elections/:id/hide-results
```

Butuh SUPER_ADMIN. Status harus CLOSED.

---

### Public: Get Active Election

```
GET /public/elections/active
```

Response `activeElection` bisa null kalau tidak ada yang aktif.

---

### Public: Get Latest Election

```
GET /public/elections/latest
```

---

## Candidates

### List Candidates

```
GET /admin/candidates/election/:electionId
```

Response:
```json
{
  "ok": true,
  "data": {
    "election": { ... },
    "candidates": [
      {
        "id": "uuid",
        "number": 1,
        "shortName": "PASLON1",
        "ketuaName": "John",
        "ketuaClass": "XII IPA 1",
        "wakilName": "Jane",
        "wakilClass": "XII IPA 2",
        "photoUrl": "...",
        "vision": "...",
        "mission": "...",
        "programs": "...",
        "isActive": true
      }
    ]
  }
}
```

---

### Create Candidate

```
POST /admin/candidates/election/:electionId
```

Body:
```json
{
  "number": 1,
  "shortName": "PASLON1",
  "ketuaName": "John",
  "ketuaClass": "XII IPA 1",
  "wakilName": "Jane",
  "wakilClass": "XII IPA 2",
  "photoUrl": "https://...",
  "vision": "...",
  "mission": "...",
  "programs": "..."
}
```

Election harus masih DRAFT.

---

### Update Candidate

```
PUT /admin/candidates/:id
```

Election harus masih DRAFT.

---

### Delete Candidate

```
DELETE /admin/candidates/:id
```

Election harus masih DRAFT.

---

### Public: Get Candidates

```
GET /public/candidates?electionSlug=pilketos-2024
```

---

## Tokens

Semua endpoint token butuh SUPER_ADMIN.

### List Tokens

```
GET /admin/tokens/:electionId
```

Query params:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` - filter: UNUSED, USED, INVALIDATED
- `batch` - filter by batch label
- `q` - pencarian (partial match) pada token atau batch label

Token yang USED/INVALIDATED akan di-redact (diganti jadi `USED-XXXX` atau `INV-XXXX`).

---

### Generate Tokens

```
POST /admin/tokens/generate/:electionId
```

Body:
```json
{
  "count": 100,
  "batch": "Batch-1"
}
```

- `count`: 1-1000
- `batch`: opsional, untuk label

Election harus masih DRAFT.

---

### Invalidate Token

```
POST /admin/tokens/invalidate/:id
```

Syarat:
- Election masih DRAFT
- Token status UNUSED

---

## Voting

### Get Candidates (Voter)

```
GET /voter/candidates
```

Butuh session voter (cookie `voter_session`).

---

### Submit Vote

```
POST /voter/vote
```

Body:
```json
{
  "candidatePairId": "uuid"
}
```

Setelah voting:
- Token jadi USED
- Session voter dihapus
- Tidak bisa pakai token lagi

Rate limit: 5 request per 30 detik.

---

## Results

### Admin Results

```
GET /admin/results/:electionId
```

Response:
```json
{
  "ok": true,
  "data": {
    "election": { ... },
    "totalVotes": 150,
    "results": [
      { "candidate": { ... }, "voteCount": 80 },
      { "candidate": { ... }, "voteCount": 70 }
    ],
    "tokenStats": {
      "used": 150,
      "unused": 50,
      "invalidated": 10,
      "total": 210
    }
  }
}
```

---

### Public Results

```
GET /public/results?electionSlug=pilketos-2024
```

Cuma bisa diakses kalau `isResultPublic = true`.

---

## Health Check

```
GET /health          # basic status
GET /health/ready    # termasuk cek DB
GET /health/live     # liveness probe
```

`/health/ready` return 503 kalau DB tidak bisa diakses.

---

## Error Codes

| Code | HTTP | Keterangan |
|------|------|------------|
| VALIDATION_ERROR | 400 | Input tidak valid |
| BAD_REQUEST | 400 | Request tidak valid |
| UNAUTHORIZED | 401 | Belum login |
| SESSION_EXPIRED | 401 | Session habis |
| TOKEN_INVALID | 401 | Token tidak ditemukan |
| INVALID_CREDENTIALS | 401 | Username/password salah |
| FORBIDDEN | 403 | Tidak punya akses |
| NOT_FOUND | 404 | Data tidak ditemukan |
| CONFLICT | 409 | Data duplikat |
| TOKEN_USED | 409 | Token sudah dipakai |
| TOO_MANY_REQUESTS | 429 | Kena rate limit |
| ELECTION_INACTIVE | 400 | Election tidak aktif |
| CANDIDATE_INVALID | 400 | Kandidat tidak valid |

---

## Rate Limiting

| Endpoint | Window | Max |
|----------|--------|-----|
| Admin login | 60s | 10 |
| Token login | 60s | 20 |
| Submit vote | 30s | 5 |

Headers:
- `X-RateLimit-Limit` - batas maksimal
- `X-RateLimit-Remaining` - sisa
- `X-RateLimit-Reset` - reset timestamp
