import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName?: string;
  planUrl?: string;
}

export function WelcomeEmail({ userName = "there", planUrl = "https://travelpro.app/plan" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Travel Pro — your first trip is waiting</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Inter, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#0D7377", padding: "24px 32px" }}>
            <Text style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 }}>✈ Travel Pro</Text>
          </Section>
          <Section style={{ padding: "32px" }}>
            <Heading style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}>
              Welcome, {userName}!
            </Heading>
            <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#374151", margin: "0 0 16px" }}>
              You just unlocked something that usually takes weeks and a travel agent — a fully personalised,
              AI-crafted multi-country itinerary, ready in minutes.
            </Text>
            {["🗺️ Tell us where to go — region, dates, budget, vibe",
              "🤖 Our AI plans your trip — optimised route, visa checks, weather",
              "✏️ You refine it — swap cities, adjust days, export to PDF"].map((step) => (
              <Text key={step} style={{ fontSize: "15px", lineHeight: "1.6", color: "#374151", margin: "0 0 8px" }}>{step}</Text>
            ))}
            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Button href={planUrl} style={{ backgroundColor: "#0D7377", color: "#fff", padding: "14px 28px", borderRadius: "8px", fontWeight: "600", fontSize: "16px", textDecoration: "none" }}>
                Start Planning Your Trip →
              </Button>
            </Section>
            <Text style={{ fontSize: "14px", color: "#6B7280" }}>
              Questions? Reply to this email — we read everything.
            </Text>
          </Section>
          <Section style={{ backgroundColor: "#F9FAFB", padding: "16px 32px", borderTop: "1px solid #E5E7EB" }}>
            <Text style={{ fontSize: "13px", color: "#9CA3AF", margin: 0, textAlign: "center" }}>
              Travel Pro · <Link href="https://travelpro.app/privacy" style={{ color: "#0D7377" }}>Privacy Policy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
