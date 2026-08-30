import * as React from "react"
import {
  Html, Head, Preview, Body, Container, Text, EmailFooter,
  main, container, heading, paragraph,
} from "./components"

interface Props {
  productName: string
  isPaid: boolean
}

export default function SubmissionRejectedEmail({
  productName = "My Product",
  isPaid = false,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Update on your submission: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Submission update</Text>
          <Text style={paragraph}>
            Unfortunately, <strong>{productName}</strong> wasn&apos;t accepted at this time.
          </Text>
          {isPaid && (
            <Text style={paragraph}>
              A full refund has been issued to your payment method.
            </Text>
          )}
          <Text style={paragraph}>
            Feel free to resubmit with updates. We&apos;d love to see it again.
          </Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
