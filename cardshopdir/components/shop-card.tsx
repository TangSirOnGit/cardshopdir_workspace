import Link from "next/link"
import Image from "next/image"
import { MapPin, Star } from "lucide-react"
import { shopTypeLabel, type ShopListItem } from "@/lib/directory"

export function ShopCard({ shop }: { shop: ShopListItem }) {
  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="group flex gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
    >
      {shop.imageUrl ? (
        <Image
          src={shop.imageUrl}
          alt={shop.name}
          width={80}
          height={80}
          className="h-20 w-20 shrink-0 rounded-md object-cover ring-1 ring-border/40"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] text-muted-foreground">
          No image
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold transition-colors group-hover:text-muted-foreground">
          {shop.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {shop.city}, {shop.state}
        </p>
        {shop.ratingValue && (
          <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
            <Star className="h-3 w-3 fill-current text-amber-500" />
            <span className="font-medium text-foreground">{shop.ratingValue}</span>
            <span>({shop.reviewCount} reviews)</span>
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          {shopTypeLabel(shop.shopType)}
        </p>
      </div>
    </Link>
  )
}

export function ShopGrid({ shops }: { shops: ShopListItem[] }) {
  if (shops.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No shops found in this area.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  )
}
