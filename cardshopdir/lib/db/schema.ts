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
  numeric,
  jsonb,
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

// ── CardShopDir enums ─────────────────────────────────────────────────────────

export const shopType = pgEnum("shop_type", [
  "tcg_specialty",
  "comic_shop",
  "game_store",
  "sports_cards",
  "hobby_store",
  "toy_store",
  "collectibles",
  "general_retail",
  "other",
])

export const claimStatus = pgEnum("claim_status", [
  "pending",
  "approved",
  "rejected",
])

export const reviewStatus = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
])

// ── CardShopDir tables ─────────────────────────────────────────────────────────

// Games (Pokemon, MTG, Yu-Gi-Oh!, etc.)
export const games = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("games_slug_idx").on(t.slug)]
)

// Shops (trading card shops)
export const shops = pgTable(
  "shops",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    metaDescription: text("meta_description"),
    descriptionSource: varchar("description_source", { length: 30 }).default("original"),

    // Location
    street: text("street"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 50 }).default("United States"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),

    // Contact
    telephone: text("telephone"),
    email: text("email"),
    website: text("website"),

    // Image
    imageUrl: text("image_url"),
    imageSource: varchar("image_source", { length: 20 }).default("none"),

    // Ratings
    ratingValue: numeric("rating_value", { precision: 3, scale: 1 }),
    reviewCount: integer("review_count").default(0),

    // Classification
    shopType: shopType("shop_type").notNull().default("other"),

    // Index control
    shouldIndex: boolean("should_index").notNull().default(false),

    // Claim status (shop owner can claim their shop)
    claimedBy: text("claimed_by").references(() => user.id, { onDelete: "set null" }),
    claimedAt: timestamp("claimed_at"),

    // Sponsor (paid placement)
    isSponsored: boolean("is_sponsored").notNull().default(false),
    sponsoredExpiresAt: timestamp("sponsored_expires_at"),

    // Source tracking
    sourceUrl: text("source_url"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => [
    index("shops_slug_idx").on(t.slug),
    index("shops_state_idx").on(t.state),
    index("shops_city_idx").on(t.city),
    index("shops_state_city_idx").on(t.state, t.city),
    index("shops_shopType_idx").on(t.shopType),
    index("shops_shouldIndex_idx").on(t.shouldIndex),
  ]
)

// Shop ↔ Game many-to-many
export const shopGames = pgTable(
  "shop_games",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    gameSource: varchar("game_source", { length: 20 }).default("original"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("shopGames_shop_game").on(t.shopId, t.gameId),
    index("shopGames_gameId_idx").on(t.gameId),
  ]
)

// Shop hours (opening hours per day group)
export const shopHours = pgTable(
  "shop_hours",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    days: jsonb("days").notNull(), // ["Monday", "Tuesday", ...]
    opens: varchar("opens", { length: 10 }), // "10:00"
    closes: varchar("closes", { length: 10 }), // "18:00"
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("shopHours_shopId_idx").on(t.shopId)]
)

// Shop reviews (UGC)
export const shopReviews = pgTable(
  "shop_reviews",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    title: varchar("title", { length: 200 }),
    body: text("body"),
    status: reviewStatus("status").notNull().default("pending"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => [
    index("shopReviews_shopId_idx").on(t.shopId),
    index("shopReviews_status_idx").on(t.status),
    uniqueIndex("shopReviews_user_shop").on(t.userId, t.shopId),
  ]
)

// Shop claims (shop owner verification)
export const shopClaims = pgTable(
  "shop_claims",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: claimStatus("status").notNull().default("pending"),
    proofUrl: text("proof_url"), // link to shop's website/social media
    notes: text("notes"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("shopClaims_shopId_idx").on(t.shopId),
    index("shopClaims_status_idx").on(t.status),
  ]
)

// ── Site settings (key-value store) ──────────────────────────────────────────

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// ── Blog posts ───────────────────────────────────────────────────────────────

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

// ── Sponsors (paid placement — reused from template) ─────────────────────────

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
