import * as React from "react"
import {
  Html, Head, Preview, Body, Container, Text, EmailFooter,
  main, container, heading, paragraph,
} from "./components"

interface Props {
  productName: string
  tierLabel: string
  isHighlight: boolean
  launchDate?: string
}

export default function PaymentConfirmedEmail({
  productName = "My Product",
  tierLabel = "Boost ($9)",
  isHighlight = false,
  launchDate,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Payment confirmed for {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Payment confirmed</Text>
          <Text style={paragraph}>
            Your <strong>{tierLabel}</strong> payment for <strong>{productName}</strong> has been processed.
          </Text>
          <Text style={paragraph}>
            {isHighlight
              ? "Your product is now live and pinned to the top of the homepage!"
              : launchDate
                ? <>Your product will go live on <strong>{launchDate}</strong> with priority placement and a lifetime guaranteed dofollow backlink.</>
                : "Your product will be included in the next weekly batch with priority placement."}
          </Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
