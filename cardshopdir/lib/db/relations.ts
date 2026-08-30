import { relations } from "drizzle-orm"
import {
  batches,
  products,
  posts,
  submissions,
  user,
  votes,
  comments,
  session,
  account,
} from "./schema"

export const batchesRelations = relations(batches, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  batch: one(batches, {
    fields: [products.batchId],
    references: [batches.id],
  }),
  votes: many(votes),
  comments: many(comments),
}))

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(user, {
    fields: [submissions.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [submissions.productId],
    references: [products.id],
  }),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
}))

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  submissions: many(submissions),
  votes: many(votes),
  comments: many(comments),
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

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(user, {
    fields: [votes.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [votes.productId],
    references: [products.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [comments.productId],
    references: [products.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentThread",
  }),
  replies: many(comments, { relationName: "commentThread" }),
}))
