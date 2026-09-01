import type { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "next-themes"

import "./globals.css"
import { SiteChrome } from "@/components/site-chrome"
import { Toaster } from "sileo"
import { SITE_URL } from "@/config"
import { getSettingsTyped } from "@/lib/settings"

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

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
        process.env.NODE_ENV === "production" ? (
          <>
            <link rel="preconnect" href="https://info.ewaltech.com" />
            <script
              defer
              src="https://info.ewaltech.com/script.js"
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
              data-exclude-search="true"
              data-auto-track="true"
            />
          </>
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
                  logo: `${SITE_URL}/logo.png`,
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
