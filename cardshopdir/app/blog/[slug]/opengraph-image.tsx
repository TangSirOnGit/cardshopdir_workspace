import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SITE_DOMAIN } from "@/config"

export const runtime = "nodejs"
export const alt = "Blog post"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    columns: { title: true, excerpt: true },
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

  if (!post) {
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
            fontSize: 16,
            fontWeight: 500,
            color: "#888888",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 24,
          }}
        >
          Blog
        </div>
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
              fontSize: 64,
              fontFamily: "Instrument Serif",
              fontWeight: 400,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
              textAlign: "center",
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            {post.title}
          </div>
          {post.excerpt && (
            <div
              style={{
                fontSize: 24,
                color: "#888888",
                textAlign: "center",
                maxWidth: 750,
                lineHeight: 1.4,
              }}
            >
              {post.excerpt}
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
