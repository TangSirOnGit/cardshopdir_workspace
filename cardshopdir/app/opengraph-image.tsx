import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { SITE_DOMAIN } from "@/config"

export const runtime = "nodejs"
export const alt = "A directory of trading card shops across the US"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const FELT = "#0c3a2c"
const INK = "#14110c"
const PAPER = "#f2e8cf"
const CREAM = "#f2e9d2"
const MARIGOLD = "#f5b82e"
const VERMILION = "#c8381a"
const SHADOW = "#04150f"

const GAMES = ["Pokémon", "Magic", "Yu-Gi-Oh!", "Sports", "Lorcana"]

function fontPath(name: string) {
  return join(process.cwd(), "assets", name)
}

export default async function OGImage() {
  const [bold, boldItalic, mono] = await Promise.all([
    readFile(fontPath("Fraunces-Bold.ttf")),
    readFile(fontPath("Fraunces-BoldItalic.ttf")),
    readFile(fontPath("JetBrainsMono-Medium.ttf")),
  ])

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: FELT,
        color: CREAM,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          position: "relative",
          padding: "56px 64px 0 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "JetBrains Mono",
              fontSize: 22,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                backgroundColor: MARIGOLD,
                marginRight: 16,
              }}
            />
            Card Shop Directory
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Fraunces",
              fontWeight: 700,
              fontSize: 104,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              marginTop: 34,
            }}
          >
            <div style={{ display: "flex" }}>Find Trading</div>
            <div style={{ display: "flex" }}>Card Shops</div>
            <div
              style={{
                display: "flex",
                color: MARIGOLD,
                fontStyle: "italic",
              }}
            >
              Near You
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 34,
              fontFamily: "JetBrains Mono",
              fontSize: 22,
              letterSpacing: "0.04em",
              color: "#a8c0b0",
            }}
          >
            7,700+ shops · all 50 states
          </div>
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 64,
            left: 780,
            width: 360,
            height: 440,
          }}
        >
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 56,
              left: 0,
              width: 250,
              height: 350,
              backgroundColor: PAPER,
              border: `4px solid ${INK}`,
              boxShadow: `8px 8px 0 ${SHADOW}`,
              transform: "rotate(-9deg)",
              padding: 14,
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                height: 190,
                backgroundColor: "#d9e07a",
                border: `3px solid ${INK}`,
              }}
            />
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontFamily: "JetBrains Mono",
                fontSize: 15,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: INK,
              }}
            >
              Pokémon
            </div>
          </div>

          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 40,
              left: 106,
              width: 250,
              height: 350,
              backgroundColor: PAPER,
              border: `4px solid ${INK}`,
              boxShadow: `8px 8px 0 ${SHADOW}`,
              transform: "rotate(8deg)",
              padding: 14,
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                height: 190,
                backgroundColor: "#e8a78a",
                border: `3px solid ${INK}`,
              }}
            />
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontFamily: "JetBrains Mono",
                fontSize: 15,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: INK,
              }}
            >
              Flesh &amp; Blood
            </div>
          </div>

          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 40,
              width: 280,
              height: 392,
              backgroundColor: PAPER,
              border: `4px solid ${INK}`,
              boxShadow: `10px 10px 0 ${SHADOW}`,
              transform: "rotate(-2deg)",
              padding: 18,
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: `3px solid ${INK}`,
                paddingBottom: 10,
                fontFamily: "JetBrains Mono",
                fontSize: 16,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: INK,
              }}
            >
              <div style={{ display: "flex" }}>Local Shop</div>
              <div style={{ display: "flex", color: VERMILION }}>No. 001</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                marginTop: 14,
                backgroundColor: MARIGOLD,
                border: `3px solid ${INK}`,
                color: INK,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Fraunces",
                  fontWeight: 700,
                  fontSize: 86,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                7,700
                <div
                  style={{
                    display: "flex",
                    fontFamily: "JetBrains Mono",
                    fontSize: 48,
                    marginLeft: 6,
                    letterSpacing: 0,
                  }}
                >
                  +
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  fontFamily: "JetBrains Mono",
                  fontSize: 16,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Card Shops
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 14,
                fontFamily: "JetBrains Mono",
                fontSize: 16,
                color: INK,
              }}
            >
              <div style={{ display: "flex" }}>50 states</div>
              <div style={{ display: "flex", color: VERMILION }}>Top rated</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 92,
          padding: "0 64px",
          backgroundColor: PAPER,
          borderTop: `5px solid ${INK}`,
          color: INK,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontWeight: 700,
            fontSize: 40,
            letterSpacing: "-0.02em",
          }}
        >
          {SITE_DOMAIN}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {GAMES.map((game, index) => (
            <div
              key={game}
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "JetBrains Mono",
                fontSize: 18,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {index > 0 && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: VERMILION,
                    margin: "0 14px",
                  }}
                />
              )}
              {game}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: bold, style: "normal", weight: 700 },
        { name: "Fraunces", data: boldItalic, style: "italic", weight: 700 },
        { name: "JetBrains Mono", data: mono, style: "normal", weight: 500 },
      ],
    }
  )
}
