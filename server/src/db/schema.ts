import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";

// ENUM
export const electionStatusEnum = pgEnum("election_status", [
  "DRAFT",
  "ACTIVE",
  "CLOSED",
  "ARCHIVED"
]);
export const tokenStatusEnum = pgEnum("token_status", ["UNUSED", "USED", "INVALIDATED"]);
export const adminRoleEnum = pgEnum("admin_role", ["SUPER_ADMIN", "COMMITTEE"]);

// elections
export const elections = pgTable(
  "elections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: electionStatusEnum("status").notNull().default("DRAFT"),
    isResultPublic: boolean("is_result_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    slugUnique: uniqueIndex("elections_slug_unique").on(t.slug),
    statusIdx: index("elections_status_idx").on(t.status),
    singleActiveUnique: uniqueIndex("elections_single_active_unique")
      .on(t.status)
      .where(sql`${t.status} = 'ACTIVE'`)
  })
);

// candidate_pairs
export const candidatePairs = pgTable(
  "candidate_pairs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    electionId: uuid("election_id")
      .notNull()
      .references(() => elections.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    shortName: varchar("short_name", { length: 100 }).notNull(),
    ketuaName: varchar("ketua_name", { length: 100 }).notNull(),
    ketuaClass: varchar("ketua_class", { length: 50 }).notNull(),
    wakilName: varchar("wakil_name", { length: 100 }).notNull(),
    wakilClass: varchar("wakil_class", { length: 50 }).notNull(),
    photoUrl: varchar("photo_url", { length: 255 }),
    vision: text("vision"),
    mission: text("mission"),
    programs: text("programs"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    electionNumberUnique: uniqueIndex("candidate_pairs_election_number_unique").on(
      t.electionId,
      t.number
    ),
    electionActiveIdx: index("candidate_pairs_election_active_idx").on(t.electionId, t.isActive)
  })
);

// tokens
export const tokens = pgTable(
  "tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    electionId: uuid("election_id")
      .notNull()
      .references(() => elections.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 32 }).notNull(),
    status: tokenStatusEnum("status").notNull().default("UNUSED"),
    generatedBatch: varchar("generated_batch", { length: 128 }),
    usedAt: timestamp("used_at", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    electionTokenUnique: uniqueIndex("tokens_election_token_unique").on(t.electionId, t.token),
    electionStatusIdx: index("tokens_election_status_idx").on(t.electionId, t.status),
    electionBatchIdx: index("tokens_election_batch_idx").on(t.electionId, t.generatedBatch)
  })
);

// votes
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    electionId: uuid("election_id")
      .notNull()
      .references(() => elections.id, { onDelete: "cascade" }),
    candidatePairId: uuid("candidate_pair_id")
      .notNull()
      .references(() => candidatePairs.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    electionIdx: index("votes_election_idx").on(t.electionId),
    electionCandidateIdx: index("votes_election_candidate_idx").on(t.electionId, t.candidatePairId)
  })
);

// admins
export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 64 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: adminRoleEnum("role").notNull().default("COMMITTEE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    usernameUnique: uniqueIndex("admins_username_unique").on(t.username)
  })
);

// admin_sessions
export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (t) => ({
    sessionTokenUnique: uniqueIndex("admin_sessions_session_token_unique").on(t.sessionToken),
    adminIdIdx: index("admin_sessions_admin_id_idx").on(t.adminId),
    expiresAtIdx: index("admin_sessions_expires_at_idx").on(t.expiresAt)
  })
);

// voter_sessions
export const voterSessions = pgTable(
  "voter_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenId: uuid("token_id")
      .notNull()
      .references(() => tokens.id, { onDelete: "cascade" }),
    electionId: uuid("election_id")
      .notNull()
      .references(() => elections.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (t) => ({
    sessionTokenUnique: uniqueIndex("voter_sessions_session_token_unique").on(t.sessionToken),
    tokenIdUnique: uniqueIndex("voter_sessions_token_id_unique").on(t.tokenId),
    tokenIdIdx: index("voter_sessions_token_id_idx").on(t.tokenId),
    electionIdIdx: index("voter_sessions_election_id_idx").on(t.electionId),
    expiresAtIdx: index("voter_sessions_expires_at_idx").on(t.expiresAt)
  })
);

// audit_logs
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => admins.id, { onDelete: "set null" }),
    electionId: uuid("election_id").references(() => elections.id, { onDelete: "set null" }),
    action: varchar("action", { length: 64 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    electionIdx: index("audit_logs_election_idx").on(t.electionId),
    adminIdx: index("audit_logs_admin_idx").on(t.adminId),
    actionIdx: index("audit_logs_action_idx").on(t.action),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt)
  })
);
