import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

export const roleFilters = ["admin", "user"] as const
export type RoleFilter = (typeof roleFilters)[number]

export const statusFilters = ["active", "banned"] as const
export type StatusFilter = (typeof statusFilters)[number]

export const sortOptions = ["newest", "oldest", "name"] as const
export type SortOption = (typeof sortOptions)[number]

export const usersSearchParams = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  role: parseAsStringEnum<RoleFilter>([...roleFilters]),
  status: parseAsStringEnum<StatusFilter>([...statusFilters]),
  sort: parseAsStringEnum<SortOption>([...sortOptions]).withDefault("newest"),
}

export const usersParamsCache = createSearchParamsCache(usersSearchParams)
