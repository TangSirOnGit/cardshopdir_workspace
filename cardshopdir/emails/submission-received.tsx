import * as React from "react"
import {
  Html, Head, Preview, Body, Container, Text, EmailFooter,
  main, container, heading, paragraph,
} from "./components"

interface Props {
  productName: string
  tierLabel: string
  isHighlight: boolean
}

export default function SubmissionReceivedEmail({
  productName = "My Product",
  tierLabel = "Free",
  isHighlight = false,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Submission received: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Submission received</Text>
          <Text style={paragraph}>
            Your product <strong>{productName}</strong> has been submitted on the <strong>{tierLabel}</strong> tier.
          </Text>
          <Text style={paragraph}>
            {isHighlight
              ? "As a Highlight submission, your product will be published instantly once payment is confirmed."
              : "We'll review it and notify you once it's been accepted or if we need any changes."}
          </Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
