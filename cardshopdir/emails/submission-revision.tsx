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
  deadline: string
  reasons?: string[]
  profileUrl?: string
}

export default function SubmissionRevisionEmail({
  productName = "My Product",
  deadline = "Sunday, April 6",
  reasons = ["Thumbnail quality too low", "Description is too vague or missing"],
  profileUrl = `${SITE_URL}/profile`,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Revision requested for {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Almost there!</Text>
          <Text style={paragraph}>
            Your product <strong>{productName}</strong> has been accepted, but
            we need a few updates before publishing.
          </Text>

          <Text
            style={{
              ...paragraph,
              fontSize: "13px",
              fontWeight: 600,
              color: "#1a1a1a",
              marginBottom: "8px",
            }}
          >
            What to fix:
          </Text>
          <Text
            style={{
              ...paragraph,
              paddingLeft: "16px",
              borderLeft: "2px solid #e0e0e0",
            }}
          >
            {reasons.map((r, i) => (
              <React.Fragment key={i}>
                · {r}
                {i < reasons.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Text>

          <Text style={paragraph}>
            Update your submission directly from your profile:
          </Text>
          <Section style={{ marginBottom: "20px" }}>
            <Button href={profileUrl} style={cta}>
              Edit my submission
            </Button>
          </Section>

          <Text
            style={{ ...paragraph, fontWeight: 600, color: "#1a1a1a" }}
          >
            Deadline: {deadline}
          </Text>
          <Text style={paragraph}>
            If we don't receive your update by then, your submission will be
            removed from the upcoming batch.
          </Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
