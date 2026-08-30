import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
  pgEnum,
  boolean,
  date,
  type AnyPgColumn,
} from "drizzle-orm/pg-core"
import { index, uniqueIndex } from "drizzle-orm/pg-core"

// ── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

// ── CardShopDir enums ────────────────────────────────────────────────────────────

export const productTier = pgEnum("product_tier", [
  "free",
  "boost",
  "highlight",
])

// ── CardShopDir tables ───────────────────────────────────────────────────────────

export const batches = pgTable(
  "batches",
  {
    id: serial("id").primaryKey(),
    weekNumber: integer("week_number").notNull(),
    year: integer("year").notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("batches_week_year").on(t.weekNumber, t.year)]
)

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    batchId: integer("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    tagline: varchar("tagline", { length: 200 }),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url").notNull(),
    websiteUrl: text("website_url").notNull(),
    position: integer("position").notNull().default(0),
    tier: productTier("tier").notNull().default("free"),
    logoUrl: text("logo_url"),
    stripePaymentId: text("stripe_payment_id"),
    highlightExpiresAt: timestamp("highlight_expires_at"),
    voteCount: integer("vote_count").notNull().default(0),
    dofollow: boolean("dofollow").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("products_batchId_idx").on(t.batchId)]
)

export const submissionStatus = pgEnum("submission_status", [
  "draft",
  "pending",
  "revision",
  "accepted",
  "rejected",
])

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    tagline: varchar("tagline", { length: 200 }),
    description: text("description"),
    websiteUrl: text("website_url").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    tier: productTier("tier").notNull().default("free"),
    status: submissionStatus("status").notNull().default("pending"),
    // Unique: the Stripe webhook may be delivered more than once, and
    // concurrently. The constraint — not a preceding SELECT — is what stops a
    // single payment from publishing two products.
    stripeSessionId: text("stripe_session_id").unique(),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    logoUrl: text("logo_url"),
    scheduledWeek: integer("scheduled_week"),
    scheduledYear: integer("scheduled_year"),
    revisionReasons: text("revision_reasons"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("submissions_userId_idx").on(t.userId),
    index("submissions_status_idx").on(t.status),
  ]
)

export const sponsors = pgTable(
  "sponsors",
  {
    id: serial("id").primaryKey(),
    slot: integer("slot").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    tagline: varchar("tagline", { length: 200 }).notNull(),
    websiteUrl: text("website_url").notNull(),
    imageUrl: text("image_url"),
    startsAt: date("starts_at", { mode: "string" }).notNull(),
    endsAt: date("ends_at", { mode: "string" }).notNull(),
    totalCents: integer("total_cents").notNull(),
    stripeSessionId: text("stripe_session_id").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("sponsors_slot_dates_idx").on(t.slot, t.startsAt, t.endsAt)]
)

// ── Site settings (key-value store) ──────────────────────────────────────────

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const postStatus = pgEnum("post_status", ["draft", "published"])

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    status: postStatus("status").notNull().default("draft"),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("posts_slug_idx").on(t.slug),
    index("posts_status_idx").on(t.status),
  ]
)

export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("votes_user_product").on(t.userId, t.productId)]
)

// ── Comments ──────────────────────────────────────────────────────

export const commentStatus = pgEnum("comment_status", ["approved", "rejected"])

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    body: text("body").notNull(),
    status: commentStatus("status").notNull().default("approved"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("comments_product_idx").on(t.productId),
    index("comments_parent_idx").on(t.parentId),
    index("comments_status_idx").on(t.status),
  ]
)
