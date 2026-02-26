import { Button, Heading, Preview, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./EmailLayout";

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
    <EmailLayout preview={`${senderName} shared a trip itinerary with you — ${destination}`}>
      <Preview>
        {senderName} shared a trip itinerary with you — {destination}
      </Preview>
      <Heading
        style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}
      >
        {senderName} wants to travel with you ✈
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#374151", margin: "0 0 16px" }}>
        <strong>{senderName}</strong> has shared their AI-crafted itinerary for{" "}
        <strong>{destination}</strong> with you.
      </Text>
      {message && (
        <Section
          style={{
            backgroundColor: "#FFF7ED",
            border: "1px solid #FED7AA",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
          }}
        >
          <Text
            style={{ fontSize: "16px", fontStyle: "italic", color: "#374151", margin: "0 0 8px" }}
          >
            &quot;{message}&quot;
          </Text>
          <Text style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>— {senderName}</Text>
        </Section>
      )}
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button
          href={shareUrl}
          style={{
            backgroundColor: "#0D7377",
            color: "#fff",
            padding: "14px 28px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
            textDecoration: "none",
          }}
        >
          View the Itinerary →
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#6B7280", margin: "24px 0 0" }}>
        Like what you see? Create your own personalised trip with Travel Pro — takes less than 5
        minutes.
      </Text>
    </EmailLayout>
  );
}

export default SharedItineraryEmail;
