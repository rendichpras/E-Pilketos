# Struktur Proyek

Panduan untuk memahami struktur kode E-Pilketos.

---

## Overview

```
e-pilketos/
├── apps/
│   ├── api/     # backend (Hono)
│   └── web/     # frontend (Next.js)
├── packages/
│   ├── types/       # shared types
│   └── validators/  # shared zod schemas
└── docs/
```

Monorepo pakai pnpm workspace.

---

## Backend (apps/api/src/)

```
src/
├── index.ts         # entry point, setup server
├── env.ts           # validasi environment variables
├── app-env.ts       # type untuk Hono context
│
├── core/            # utilities yang dipake di mana-mana
│   ├── errors/      # custom error classes
│   ├── middleware/  # error handler, rate limit, dll
│   ├── response/    # helper untuk response
│   └── validation/  # helper untuk validasi
│
├── features/        # fitur-fitur utama
│   ├── auth/
│   │   ├── admin/   # login admin, middleware auth
│   │   └── voter/   # login token
│   ├── elections/   # CRUD elections
│   ├── candidates/  # CRUD candidates
│   ├── tokens/      # generate, list, invalidate
│   ├── voting/      # voting + results
│   └── health/      # health check
│
├── db/
│   ├── client.ts    # drizzle client
│   └── schema.ts    # definisi tabel
│
├── utils/           # redis, session, token redact
│
└── scripts/         # maintenance, seed admin, dll
```

---

### Pattern per Feature

Setiap folder di `features/` punya struktur mirip:

```
elections/
├── index.ts       # export
├── repository.ts  # query database
├── service.ts     # business logic
└── routes.ts      # endpoint handlers
```

Prinsip:
- **routes** cuma handle HTTP (validasi, panggil service, return response)
- **service** isi logic bisnis
- **repository** query database

---

### Error Classes

File: `core/errors/http-error.ts`

| Class | Status |
|-------|--------|
| BadRequestError | 400 |
| ValidationError | 400 |
| UnauthorizedError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ConflictError | 409 |
| TooManyRequestsError | 429 |

Cara pakai:
```typescript
throw new NotFoundError("Election");
// response: { ok: false, error: "Election tidak ditemukan", code: "NOT_FOUND" }
```

---

### Response Helpers

File: `core/response/index.ts`

```typescript
success(c, data)           // 200
created(c, data)           // 201
noContent(c)               // 200 tanpa data
paginated(c, data, pagination)
error(c, status, message, code)
```

---

### Validation Helpers

File: `core/validation/index.ts`

```typescript
const data = await validateBody(c, createElectionSchema);
const query = validateQuery(c, paginationSchema);
```

Otomatis throw ValidationError kalau gagal.

---

## Frontend (apps/web/src/)

```
src/
├── app/              # Next.js App Router
│   ├── page.tsx      # home
│   ├── admin/        # halaman admin
│   ├── vote/         # halaman voting
│   └── hasil/        # hasil publik
│
├── components/
│   ├── ui/           # shadcn components
│   ├── admin/        # komponen khusus admin
│   └── vote/         # komponen voting
│
├── lib/
│   ├── api/
│   │   ├── client.ts # fetch dari browser
│   │   └── server.ts # fetch dari server component
│   ├── types.ts      # re-export dari packages/types
│   └── utils.ts
│
└── hooks/
```

---

### API Client

Untuk client component:
```typescript
import { apiClient } from "@/lib/api";

const data = await apiClient.get("/admin/elections");
```

Untuk server component:
```typescript
import { serverGet } from "@/lib/api/server";

const data = await serverGet("/admin/elections");
```

---

## Shared Packages

### packages/types

TypeScript types yang dipake di frontend dan backend:

- Entity: Election, CandidatePair, Token, Admin, Vote
- Response types: ApiSuccessResponse, ApiErrorResponse
- DTO: CreateElectionDto, UpdateElectionDto, dll

### packages/validators

Zod schemas:

- createElectionSchema, updateElectionSchema
- createCandidateSchema, updateCandidateSchema
- adminLoginSchema, voterLoginSchema
- paginationQuerySchema

Helper:
```typescript
validateOrThrow(schema, data)  // throw kalau error
validateSafe(schema, data)     // return { success, data/error }
```

---

## Database

File: `apps/api/src/db/schema.ts`

Tabel:
- elections
- candidate_pairs
- tokens
- votes
- admins
- admin_sessions
- voter_sessions
- audit_logs

Pakai Drizzle ORM dengan PostgreSQL.

---

## Naming Convention

| Type | Style | Contoh |
|------|-------|--------|
| File | kebab-case | `error-handler.ts` |
| Function | camelCase | `getActiveElection` |
| Type/Interface | PascalCase | `Election`, `CreateElectionDto` |
| Constant | UPPER_SNAKE | `MAX_TOKEN_COUNT` |
| Hono app | camelCase + App | `adminElectionsApp` |
| Service | camelCase + Service | `electionService` |

---

## Scripts

```bash
pnpm dev              # jalankan semua
pnpm dev:api          # backend aja
pnpm dev:web          # frontend aja

pnpm db:generate      # generate migration
pnpm db:migrate       # apply migration

pnpm seed:admin       # buat admin
pnpm maintenance:run  # maintenance
pnpm integrity:check  # cek integritas
```
