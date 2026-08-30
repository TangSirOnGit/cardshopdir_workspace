import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

export const tiers: Tier[] = ["free", "boost", "highlight"]
export type Tier = "free" | "boost" | "highlight"

export const sortOptions: SortOption[] = ["newest", "oldest", "votes", "name"]
export type SortOption = "newest" | "oldest" | "votes" | "name"

export const productsSearchParams = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  tier: parseAsStringEnum<Tier>(tiers),
  sort: parseAsStringEnum<SortOption>(sortOptions).withDefault("newest"),
}

export const productsParamsCache =
  createSearchParamsCache(productsSearchParams)
