import type { Metadata } from "next"
import { searchShops } from "@/lib/directory"
import { ShopGrid } from "@/components/shop-card"
import { SearchBox } from "@/components/search-box"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Search Trading Card Shops — CardShopDir",
  description:
    "Search for trading card shops by name, city, state, street, or zip code.",
  robots: { index: false, follow: true },
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = (q || "").trim()
  const results = query ? await searchShops(query, 30) : []

  return (
    <div className="space-y-6 pt-4">
      <header>
        <h1 className="font-serif text-3xl tracking-tight">
          {query ? `Search: "${query}"` : "Search Shops"}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {query
            ? `${results.length} result${results.length !== 1 ? "s" : ""} found`
            : "Enter a shop name, city, state, street, or zip to search."}
        </p>
      </header>

      <SearchBox className="max-w-md" initialValue={query} />

      {query && <ShopGrid shops={results} />}
    </div>
  )
}
