/* eslint-disable react/no-unescaped-entities */
import * as React from "react"
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  EmailFooter,
  main,
  container,
  heading,
  paragraph,
} from "./components"

export default function WelcomeEmail() {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to CardShopDir, a directory of trading card shops across the US
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Welcome to CardShopDir</Text>
          <Text style={paragraph}>
            You're now subscribed to our newsletter about trading card shops.
          </Text>
          <Text style={paragraph}>
            Every Monday, we hand-pick the best new products and present them
            visually, delivered straight to your inbox.
          </Text>
          <EmailFooter marketing />
        </Container>
      </Body>
    </Html>
  )
}
