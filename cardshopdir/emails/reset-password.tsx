import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  EmailFooter,
  main,
  container,
  heading,
  paragraph,
  cta,
} from "./components"
import * as React from "react"

interface ResetPasswordProps {
  url: string
}

export default function ResetPasswordTemplate({ url }: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your CardShopDir password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Reset your password</Text>
            <Text style={paragraph}>
              We received a request to reset your password. Click the button
              below to choose a new one.
            </Text>
            <a href={url} style={cta}>
              Reset password
            </a>
            <Text style={{ ...paragraph, marginTop: "24px", fontSize: "13px" }}>
              This link expires in 1 hour. If you didn&apos;t request a password
              reset, you can safely ignore this email.
            </Text>
          </Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
