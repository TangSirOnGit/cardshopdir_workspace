import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

export const commentStatuses = ["approved", "rejected"] as const
export type CommentStatus = (typeof commentStatuses)[number]

export const sortOptions = ["newest", "oldest"] as const
export type SortOption = (typeof sortOptions)[number]

export const commentsSearchParams = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum<CommentStatus>([...commentStatuses]),
  sort: parseAsStringEnum<SortOption>([...sortOptions]).withDefault("newest"),
}

export const commentsParamsCache = createSearchParamsCache(commentsSearchParams)
