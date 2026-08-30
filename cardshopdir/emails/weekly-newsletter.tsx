import * as React from "react"
import {
  Html, Head, Preview, Body, Container, Text, Link, Button, Section, Img, EmailFooter,
  main, container, heading, paragraph, cta,
} from "./components"

import { SITE_URL } from "@/config"

interface Product {
  name: string
  slug: string
  tagline: string | null
  tier: string
  thumbnailUrl: string | null
}

interface Props {
  weekNumber: number
  year: number
  products: Product[]
}

export default function WeeklyNewsletterEmail({
  weekNumber = 13,
  year = 2026,
  products = [
    { name: "Example Product", slug: "example", tagline: "A great product", tier: "boost", thumbnailUrl: null },
    { name: "Another One", slug: "another", tagline: null, tier: "free", thumbnailUrl: null },
  ],
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`This week on CardShopDir · Week ${weekNumber} launches`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>This week on CardShopDir</Text>
          <Text style={paragraph}>
            Here are the top launches from Week {weekNumber}, {year}.
          </Text>

          <Section style={{ margin: "24px 0" }}>
            {products.map((product, i) => (
              <Section key={product.slug} style={{ paddingBottom: "12px", marginBottom: "12px", borderBottom: i < products.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                {product.thumbnailUrl && (
                  <Link href={`${SITE_URL}/p/${product.slug}`}>
                    <Img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      width="420"
                      height="236"
                      style={{ width: "100%", height: "auto", borderRadius: "8px", marginBottom: "8px", objectFit: "cover" }}
                    />
                  </Link>
                )}
                <Link
                  href={`${SITE_URL}/p/${product.slug}`}
                  style={{
                    color: "#1a1a1a",
                    textDecoration: "none",
                    fontSize: "15px",
                    fontWeight: 600,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  {`${i + 1}. ${product.name}`}
                </Link>
                {product.tier === "boost" && (
                  <span style={{ color: "#3b82f6", fontSize: "11px", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", marginLeft: "6px" }}>
                    ⚡ Boosted
                  </span>
                )}
                {product.tier === "highlight" && (
                  <span style={{ color: "#f59e0b", fontSize: "11px", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", marginLeft: "6px" }}>
                    ★ Featured
                  </span>
                )}
                {product.tagline && (
                  <Text style={{ color: "#888888", fontSize: "13px", margin: "4px 0 0" }}>
                    {product.tagline}
                  </Text>
                )}
              </Section>
            ))}
          </Section>

          <Section style={{ margin: "24px 0" }}>
            <Button style={cta} href={SITE_URL}>
              See all launches
            </Button>
          </Section>

          <EmailFooter marketing />
        </Container>
      </Body>
    </Html>
  )
}
