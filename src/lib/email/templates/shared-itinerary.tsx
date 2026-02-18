import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";
import * as React from "react";

interface SharedItineraryEmailProps {
  senderName?: string;
  destination?: string;
  shareUrl?: string;
  message?: string;
}

export function SharedItineraryEmail({
  senderName = "Someone",
  destination = "an exciting trip",
  shareUrl = "https://travelpro.app",
  message,
}: SharedItineraryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{senderName} shared a trip itinerary with you — {destination}</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Inter, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#0D7377", padding: "24px 32px" }}>
            <Text style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 }}>✈ Travel Pro</Text>
          </Section>
          <Section style={{ padding: "32px" }}>
            <Heading style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}>
              {senderName} wants to travel with you ✈
            </Heading>
            <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#374151", margin: "0 0 16px" }}>
              <strong>{senderName}</strong> has shared their AI-crafted itinerary for <strong>{destination}</strong> with you.
            </Text>
            {message && (
              <Section style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "8px", padding: "16px", margin: "16px 0" }}>
                <Text style={{ fontSize: "16px", fontStyle: "italic", color: "#374151", margin: "0 0 8px" }}>"{message}"</Text>
                <Text style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>— {senderName}</Text>
              </Section>
            )}
            <Section style={{ textAlign: "center", margin: "24px 0" }}>
              <Button href={shareUrl} style={{ backgroundColor: "#0D7377", color: "#fff", padding: "14px 28px", borderRadius: "8px", fontWeight: "600", fontSize: "16px", textDecoration: "none" }}>
                View the Itinerary →
              </Button>
            </Section>
            <Text style={{ fontSize: "14px", color: "#6B7280", margin: "24px 0 0" }}>
              Like what you see? Create your own personalised trip with Travel Pro — takes less than 5 minutes.
            </Text>
          </Section>
          <Section style={{ backgroundColor: "#F9FAFB", padding: "16px 32px", borderTop: "1px solid #E5E7EB" }}>
            <Text style={{ fontSize: "13px", color: "#9CA3AF", margin: 0, textAlign: "center" }}>Travel Pro · AI-Powered Trip Planning</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default SharedItineraryEmail;
