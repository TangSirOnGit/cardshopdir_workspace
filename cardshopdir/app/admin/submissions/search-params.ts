import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

export const statuses: Status[] = [
  "pending",
  "revision",
  "accepted",
  "rejected",
  "draft",
]
export type Status = "pending" | "revision" | "accepted" | "rejected" | "draft"

export const sortOptions: SortOption[] = ["newest", "oldest", "name"]
export type SortOption = "newest" | "oldest" | "name"

export const submissionsSearchParams = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum<Status>(statuses),
  sort: parseAsStringEnum<SortOption>(sortOptions).withDefault("newest"),
}

export const submissionsParamsCache =
  createSearchParamsCache(submissionsSearchParams)
