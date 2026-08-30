import { relations } from "drizzle-orm"
import {
  shops,
  games,
  shopGames,
  shopHours,
  shopReviews,
  shopClaims,
  posts,
  sponsors,
  user,
  session,
  account,
} from "./schema"

// ── Shop relations ────────────────────────────────────────────────────────────

export const shopsRelations = relations(shops, ({ many, one }) => ({
  games: many(shopGames),
  hours: many(shopHours),
  reviews: many(shopReviews),
  claims: many(shopClaims),
  claimedBy: one(user, {
    fields: [shops.claimedBy],
    references: [user.id],
  }),
}))

// ── Game relations ────────────────────────────────────────────────────────────

export const gamesRelations = relations(games, ({ many }) => ({
  shops: many(shopGames),
}))

// ── ShopGames (junction) ──────────────────────────────────────────────────────

export const shopGamesRelations = relations(shopGames, ({ one }) => ({
  shop: one(shops, {
    fields: [shopGames.shopId],
    references: [shops.id],
  }),
  game: one(games, {
    fields: [shopGames.gameId],
    references: [games.id],
  }),
}))

// ── ShopHours ─────────────────────────────────────────────────────────────────

export const shopHoursRelations = relations(shopHours, ({ one }) => ({
  shop: one(shops, {
    fields: [shopHours.shopId],
    references: [shops.id],
  }),
}))

// ── ShopReviews ───────────────────────────────────────────────────────────────

export const shopReviewsRelations = relations(shopReviews, ({ one }) => ({
  shop: one(shops, {
    fields: [shopReviews.shopId],
    references: [shops.id],
  }),
  user: one(user, {
    fields: [shopReviews.userId],
    references: [user.id],
  }),
}))

// ── ShopClaims ────────────────────────────────────────────────────────────────

export const shopClaimsRelations = relations(shopClaims, ({ one }) => ({
  shop: one(shops, {
    fields: [shopClaims.shopId],
    references: [shops.id],
  }),
  user: one(user, {
    fields: [shopClaims.userId],
    references: [user.id],
  }),
  reviewedBy: one(user, {
    fields: [shopClaims.reviewedBy],
    references: [user.id],
    relationName: "claimReviewer",
  }),
}))

// ── Blog posts ────────────────────────────────────────────────────────────────

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
}))

// ── Sponsors ──────────────────────────────────────────────────────────────────

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  user: one(user, {
    fields: [sponsors.userId],
    references: [user.id],
  }),
}))

// ── User relations ────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  reviews: many(shopReviews),
  claims: many(shopClaims),
  posts: many(posts),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))
