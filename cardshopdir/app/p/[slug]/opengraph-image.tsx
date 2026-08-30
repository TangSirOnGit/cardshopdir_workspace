import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SITE_DOMAIN } from "@/config"

export const runtime = "nodejs"
export const alt = "Product detail page"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  })

  const instrumentSerif = await readFile(
    join(process.cwd(), "assets/InstrumentSerif-Regular.ttf")
  )

  const fonts = [
    {
      name: "Instrument Serif",
      data: instrumentSerif,
      style: "normal" as const,
      weight: 400 as const,
    },
  ]

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            fontSize: 64,
            fontFamily: "Instrument Serif",
            color: "#1a1a1a",
          }}
        >
          {SITE_DOMAIN}
        </div>
      ),
      { ...size, fonts },
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontFamily: "Instrument Serif",
              fontWeight: 400,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {product.name}
          </div>
          {product.tagline && (
            <div
              style={{
                fontSize: 28,
                color: "#888888",
                textAlign: "center",
                maxWidth: 800,
              }}
            >
              {product.tagline}
            </div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 20,
            fontFamily: "Instrument Serif",
            color: "#c0c0c0",
          }}
        >
          {SITE_DOMAIN}
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
