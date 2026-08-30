import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { SITE_DOMAIN } from "@/config"

export const runtime = "nodejs"
export const alt = "A directory of trading card shops across the US"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  const instrumentSerif = await readFile(
    join(process.cwd(), "assets/InstrumentSerif-Regular.ttf")
  )

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
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontFamily: "Instrument Serif",
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          {SITE_DOMAIN}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#888888",
          }}
        >
          A directory of trading card shops across the US
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: instrumentSerif,
          style: "normal" as const,
          weight: 400 as const,
        },
      ],
    },
  )
}
