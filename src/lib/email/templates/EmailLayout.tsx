import { Body, Container, Html, Head, Link, Section, Text } from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  /** Show privacy policy link in footer (used by welcome email). */
  showPrivacyLink?: boolean;
}

export function EmailHeader() {
  return (
    <Section style={{ backgroundColor: "#0D7377", padding: "24px 32px" }}>
      <Text style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 }}>
        ✈ Travel Pro
      </Text>
    </Section>
  );
}

export function EmailFooter({ showPrivacyLink }: { showPrivacyLink?: boolean }) {
  return (
    <Section
      style={{
        backgroundColor: "#F9FAFB",
        padding: "16px 32px",
        borderTop: "1px solid #E5E7EB",
      }}
    >
      <Text style={{ fontSize: "13px", color: "#9CA3AF", margin: 0, textAlign: "center" }}>
        Travel Pro
        {showPrivacyLink ? (
          <>
            {" · "}
            <Link href="https://travelpro.app/privacy" style={{ color: "#0D7377" }}>
              Privacy Policy
            </Link>
          </>
        ) : (
          " · AI-Powered Trip Planning"
        )}
      </Text>
    </Section>
  );
}

export function EmailLayout({ preview, children, showPrivacyLink }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {/* Preview text is visible in mail clients but not in the component tree */}
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Inter, sans-serif" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "40px auto",
            backgroundColor: "#fff",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <EmailHeader />
          <Section style={{ padding: "32px" }}>{children}</Section>
          <EmailFooter showPrivacyLink={showPrivacyLink} />
        </Container>
      </Body>
    </Html>
  );
}
