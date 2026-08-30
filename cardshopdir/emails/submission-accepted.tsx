/* eslint-disable react/no-unescaped-entities */
import * as React from "react"
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  EmailFooter,
  main,
  container,
  heading,
  paragraph,
  cta,
} from "./components"
import { SITE_URL } from "@/config"

interface Props {
  productName: string
  tier: "free" | "boost" | "highlight"
  launchInfo: string
  /** Link to the user's profile where they can upgrade a free submission. */
  upgradeUrl?: string
}

export default function SubmissionAcceptedEmail({
  productName = "My Product",
  tier = "free",
  launchInfo = "on Monday, May 18",
  upgradeUrl = `${SITE_URL}/profile`,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{productName} has been accepted on CardShopDir!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Your product is accepted!</Text>
          <Text style={paragraph}>
            Great news, <strong>{productName}</strong> has been approved for
            CardShopDir. It will go live <strong>{launchInfo}</strong>.
          </Text>
          {tier === "boost" && (
            <Text style={paragraph}>
              As a Boost submission, your product will have priority placement
              and a lifetime guaranteed dofollow backlink.
            </Text>
          )}

          {tier === "free" && (
            <>
              <Hr style={{ borderColor: "#eaeaea", margin: "28px 0 20px" }} />
              <Text
                style={{
                  ...paragraph,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}
              >
                Don't want to wait?
              </Text>
              <Text
                style={{ ...paragraph, fontSize: "14px", marginBottom: "16px" }}
              >
                Upgrade to Boost ($9) and your product moves to the very next
                batch with a permanent dofollow backlink — skip the queue
                entirely.
              </Text>
              <Section style={{ marginBottom: "20px" }}>
                <Button href={upgradeUrl} style={cta}>
                  Upgrade to Boost — $9
                </Button>
              </Section>
              <Text
                style={{
                  ...paragraph,
                  fontSize: "12px",
                  color: "#999999",
                }}
              >
                Or publish instantly with Highlight ($29) — manage both from
                your{" "}
                <a href={upgradeUrl} style={{ color: "#1a1a1a" }}>
                  profile
                </a>
                .
              </Text>
            </>
          )}

          <Text style={paragraph}>
            You'll receive another email with a direct link when it launches.
            Share it with your audience and collect votes to climb the rankings!
          </Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
