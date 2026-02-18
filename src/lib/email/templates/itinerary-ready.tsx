import {
  Body, Button, Container, Head, Heading, Html, Hr, Preview, Section, Text,
} from "@react-email/components";
import * as React from "react";

interface ItineraryReadyEmailProps {
  userName?: string;
  destination?: string;
  cities?: string[];
  dates?: string;
  budget?: string;
  itineraryUrl?: string;
}

export function ItineraryReadyEmail({
  userName = "there",
  destination = "Your Trip",
  cities = [],
  dates = "",
  budget = "",
  itineraryUrl = "https://travelpro.app/dashboard",
}: ItineraryReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {destination} itinerary is ready ✈</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Inter, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#0D7377", padding: "24px 32px" }}>
            <Text style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 }}>✈ Travel Pro</Text>
          </Section>
          <Section style={{ padding: "32px" }}>
            <Heading style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}>
              Your trip is ready! 🎉
            </Heading>
            <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#374151", margin: "0 0 16px" }}>
              Hey {userName}, your AI-crafted itinerary for <strong>{destination}</strong> is ready.
            </Text>
            {cities.length > 0 && (
              <Section style={{ backgroundColor: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: "8px", padding: "16px", margin: "16px 0" }}>
                <Text style={{ fontSize: "12px", fontWeight: "600", color: "#0D7377", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Your Route</Text>
                <Text style={{ fontSize: "16px", color: "#111827", fontWeight: "500", margin: "0 0 12px" }}>{cities.join(" → ")}</Text>
                {dates && <><Text style={{ fontSize: "12px", fontWeight: "600", color: "#0D7377", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Dates</Text>
                <Text style={{ fontSize: "15px", color: "#374151", margin: "0 0 12px" }}>{dates}</Text></>}
                {budget && <><Text style={{ fontSize: "12px", fontWeight: "600", color: "#0D7377", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Budget</Text>
                <Text style={{ fontSize: "15px", color: "#374151", margin: 0 }}>{budget}</Text></>}
              </Section>
            )}
            <Section style={{ textAlign: "center", margin: "24px 0" }}>
              <Button href={itineraryUrl} style={{ backgroundColor: "#0D7377", color: "#fff", padding: "14px 28px", borderRadius: "8px", fontWeight: "600", fontSize: "16px", textDecoration: "none" }}>
                View Full Itinerary →
              </Button>
            </Section>
            <Hr style={{ borderColor: "#E5E7EB", margin: "24px 0" }} />
            <Text style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
              Edit your itinerary, share it with travel companions, or generate a fresh version anytime.
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

export default ItineraryReadyEmail;
