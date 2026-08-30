import * as React from "react"
import {
  Html, Head, Preview, Body, Container, Text, EmailFooter,
  main, container, heading, paragraph,
} from "./components"

interface Props {
  name: string
  slot: number
  startDate: string
  endDate: string
  totalFormatted: string
}

export default function SponsorConfirmedEmail({
  name = "My Brand",
  slot = 1,
  startDate = "2025-01-15",
  endDate = "2025-01-30",
  totalFormatted = "$45.00",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Sponsor booking confirmed for {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Sponsor booking confirmed</Text>
          <Text style={paragraph}>
            Your sponsor campaign for <strong>{name}</strong> has been booked.
          </Text>
          <Text style={paragraph}>
            Slot {slot} · {startDate} to {endDate} · {totalFormatted}
          </Text>
          <Text style={paragraph}>
            Your ad will appear across the site during the selected dates. No further action is needed.
          </Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}
