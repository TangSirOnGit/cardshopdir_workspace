import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Img,
} from "@react-email/components"
import * as React from "react"
// SITE_NAME is now a DB setting — pass `siteName` as a prop to EmailFooter

// ── Shared styles ─────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "Georgia, 'Times New Roman', serif",
}

const container: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "40px 24px",
}

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "normal",
  color: "#1a1a1a",
  lineHeight: "1.3",
  margin: "0 0 16px",
  fontFamily: "Georgia, 'Times New Roman', serif",
}

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#555555",
  margin: "0 0 16px",
}

const cta: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  padding: "12px 28px",
  borderRadius: "999px",
  fontSize: "14px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  textDecoration: "none",
  display: "inline-block",
}

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#999999",
  marginTop: "32px",
}

const hr: React.CSSProperties = {
  borderColor: "#f0f0f0",
  margin: "24px 0",
}

const unsubLink: React.CSSProperties = {
  color: "#bbbbbb",
  textDecoration: "underline",
  fontSize: "12px",
}

function EmailFooter({ marketing = false, siteName = "CardShopDir" }: { marketing?: boolean; siteName?: string }) {
  return (
    <>
      <Hr style={hr} />
      <Text style={footer}>The {siteName} team</Text>
      {marketing && (
        <Text style={{ fontSize: "12px", color: "#bbbbbb", marginTop: "12px" }}>
          You can{" "}
          <Link href={"{{unsubscribeUrl}}"} style={unsubLink}>unsubscribe</Link>
          {" "}at any time.
        </Text>
      )}
    </>
  )
}

// ── Exports ───────────────────────────────────────────────────────────────────

export {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Img,
  EmailFooter,
  main,
  container,
  heading,
  paragraph,
  cta,
  footer,
  hr,
}
