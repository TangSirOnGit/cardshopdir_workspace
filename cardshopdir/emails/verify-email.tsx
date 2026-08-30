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

interface VerifyEmailProps {
  url: string
}

export default function VerifyEmailTemplate({ url }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to get started on CardShopDir</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Verify your email</Text>
            <Text style={paragraph}>
              Click the button below to verify your email and activate your
              CardShopDir account.
            </Text>
            <a href={url} style={cta}>
              Verify email
            </a>
            <Text style={{ ...paragraph, marginTop: "24px", fontSize: "13px" }}>
              If you didn&apos;t create an account on CardShopDir, you can safely
              ignore this email.
            </Text>
          </Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
