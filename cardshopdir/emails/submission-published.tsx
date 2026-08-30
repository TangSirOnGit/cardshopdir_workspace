/* eslint-disable react/no-unescaped-entities */
import * as React from "react"
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Button,
  Section,
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
  slug: string
  isHighlight?: boolean
}

export default function SubmissionPublishedEmail({
  productName = "My Product",
  slug = "my-product",
  isHighlight = false,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{productName} is now live on CardShopDir!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>You're live!</Text>
          {isHighlight && (
            <Text style={paragraph}>
              Payment confirmed. Your Highlight ($29) is active.
            </Text>
          )}
          <Text style={paragraph}>
            <strong>{productName}</strong> is now live on CardShopDir and open for
            votes.
            {isHighlight
              ? " Your product is featured on the homepage for 7 days with a lifetime guaranteed dofollow backlink."
              : ""}
          </Text>
          <Section style={{ margin: "24px 0" }}>
            <Button style={cta} href={`${SITE_URL}/p/${slug}`}>
              View your product
            </Button>
          </Section>
          {!isHighlight && (
            <Text style={paragraph}>
              Share it with your audience and collect votes to climb the
              rankings. The top 3 products earn a lifetime dofollow backlink!
            </Text>
          )}
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
