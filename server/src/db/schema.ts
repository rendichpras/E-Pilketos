import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum
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

// TABLE: elections
export const elections = pgTable("elections", {
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
});

// TABLE: candidate_pairs
export const candidatePairs = pgTable("candidate_pairs", {
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
});

// TABLE: tokens
export const tokens = pgTable("tokens", {
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
});

// TABLE: votes
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  electionId: uuid("election_id")
    .notNull()
    .references(() => elections.id, { onDelete: "cascade" }),
  tokenId: uuid("token_id")
    .notNull()
    .references(() => tokens.id, { onDelete: "restrict" }),
  candidatePairId: uuid("candidate_pair_id")
    .notNull()
    .references(() => candidatePairs.id, { onDelete: "restrict" }),
  clientIpHash: varchar("client_ip_hash", { length: 128 }),
  userAgent: varchar("user_agent", { length: 512 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// TABLE: admins
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 64 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: adminRoleEnum("role").notNull().default("COMMITTEE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// TABLE: admin_sessions
export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
});

// TABLE: audit_logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").references(() => admins.id, {
    onDelete: "set null"
  }),
  electionId: uuid("election_id").references(() => elections.id, {
    onDelete: "set null"
  }),
  action: varchar("action", { length: 64 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
