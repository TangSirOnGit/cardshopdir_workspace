import {
  Inter,
  DM_Sans,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Outfit,
  Manrope,
  Sora,
  Albert_Sans,
  Nunito_Sans,
  Work_Sans,
  Rubik,
  Instrument_Serif,
  Playfair_Display,
  Lora,
  Source_Serif_4,
  Crimson_Pro,
  Libre_Baskerville,
  Merriweather,
  EB_Garamond,
  Fraunces,
  DM_Serif_Display,
} from "next/font/google"
import type { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "next-themes"

import "./globals.css"
import { cn } from "@/lib/utils"
import { SiteChrome } from "@/components/site-chrome"
import { Toaster } from "sileo"
import { SITE_URL } from "@/config"
import { getSettingsTyped } from "@/lib/settings"

// ── Sans-serif fonts ─────────────────────────────────────────────────────
// preload: false → only the 2 active fonts (selected in admin settings) are
// downloaded by the browser. Without this flag Next.js would preload ALL fonts.
const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: false,
})
const fontDmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  preload: false,
})
const fontPlusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  preload: false,
})
const fontSpaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  preload: false,
})
const fontOutfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  preload: false,
})
const fontManrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  preload: false,
})
const fontSora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  preload: false,
})
const fontAlbertSans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-albert-sans",
  preload: false,
})
const fontNunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  preload: false,
})
const fontWorkSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  preload: false,
})
const fontRubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  preload: false,
})

// ── Serif fonts ──────────────────────────────────────────────────────────
const fontInstrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  preload: false,
})
const fontPlayfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  preload: false,
})
const fontLora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  preload: false,
})
const fontSourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  preload: false,
})
const fontCrimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  preload: false,
})
const fontLibreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  preload: false,
})
const fontMerriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  preload: false,
})
const fontEbGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  preload: false,
})
const fontFraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  preload: false,
})
const fontDmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif-display",
  preload: false,
})

type FontEntry = { font: typeof fontInter; cssVar: string }

const fontsSans: Record<string, FontEntry> = {
  inter: { font: fontInter, cssVar: "--font-inter" },
  "dm-sans": { font: fontDmSans, cssVar: "--font-dm-sans" },
  "plus-jakarta-sans": {
    font: fontPlusJakarta,
    cssVar: "--font-plus-jakarta-sans",
  },
  "space-grotesk": { font: fontSpaceGrotesk, cssVar: "--font-space-grotesk" },
  outfit: { font: fontOutfit, cssVar: "--font-outfit" },
  manrope: { font: fontManrope, cssVar: "--font-manrope" },
  sora: { font: fontSora, cssVar: "--font-sora" },
  "albert-sans": { font: fontAlbertSans, cssVar: "--font-albert-sans" },
  "nunito-sans": { font: fontNunitoSans, cssVar: "--font-nunito-sans" },
  "work-sans": { font: fontWorkSans, cssVar: "--font-work-sans" },
  rubik: { font: fontRubik, cssVar: "--font-rubik" },
}

const fontsSerif: Record<string, FontEntry> = {
  "instrument-serif": {
    font: fontInstrumentSerif,
    cssVar: "--font-instrument-serif",
  },
  "playfair-display": { font: fontPlayfair, cssVar: "--font-playfair-display" },
  lora: { font: fontLora, cssVar: "--font-lora" },
  "source-serif-4": { font: fontSourceSerif, cssVar: "--font-source-serif-4" },
  "crimson-pro": { font: fontCrimsonPro, cssVar: "--font-crimson-pro" },
  "libre-baskerville": {
    font: fontLibreBaskerville,
    cssVar: "--font-libre-baskerville",
  },
  merriweather: { font: fontMerriweather, cssVar: "--font-merriweather" },
  "eb-garamond": { font: fontEbGaramond, cssVar: "--font-eb-garamond" },
  fraunces: { font: fontFraunces, cssVar: "--font-fraunces" },
  "dm-serif-display": {
    font: fontDmSerifDisplay,
    cssVar: "--font-dm-serif-display",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    metadataBase: new URL(SITE_URL),
    title: `${settings.siteName} - A directory of trading card shops across the US`,
    description: settings.siteDescription,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `${settings.siteName} - A directory of trading card shops across the US`,
      description: settings.siteDescription,
      url: SITE_URL,
      siteName: settings.siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSettingsTyped()

  const activeSans = fontsSans[settings.fontSans] ?? fontsSans.inter
  const activeSerif =
    fontsSerif[settings.fontSerif] ?? fontsSerif["instrument-serif"]

  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        activeSans.font.variable,
        activeSerif.font.variable
      )}
      style={
        {
          "--font-sans": `var(${activeSans.cssVar})`,
          "--font-serif": `var(${activeSerif.cssVar})`,
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
        process.env.NODE_ENV === "production" ? (
          <script
            defer
            src="https://info.ewaltech.com/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-exclude-search="true"
            data-auto-track="true"
          />
        ) : null}
      </head>
      <body className="flex min-h-svh flex-col bg-background font-sans text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: settings.siteName,
                  url: SITE_URL,
                  logo: `${SITE_URL}/logo.webp`,
                  contactPoint: {
                    "@type": "ContactPoint",
                    email: settings.contactEmail || undefined,
                    contactType: "customer support",
                  },
                },
                {
                  "@type": "WebSite",
                  name: settings.siteName,
                  url: SITE_URL,
                  description: settings.siteDescription,
                  publisher: {
                    "@type": "Organization",
                    name: settings.siteName,
                  },
                },
              ],
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
          >
            Skip to content
          </a>
          <NuqsAdapter>
            <SiteChrome siteName={settings.siteName}>{children}</SiteChrome>
            <Toaster
              position="top-center"
              options={{
                fill: "#171717",
                styles: { title: "text-white!", description: "text-white/75!" },
              }}
            />
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
