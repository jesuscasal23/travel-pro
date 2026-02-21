import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Travel Pro — AI-Powered Trip Planning",
    template: "%s | Travel Pro",
  },
  description:
    "Plan your dream multi-country trip in minutes. AI-powered itineraries, visa checks, weather insights, and more.",
  keywords: [
    "travel planning",
    "AI itinerary",
    "trip planner",
    "multi-country travel",
    "budget travel",
    "visa requirements",
  ],
  authors: [{ name: "Travel Pro" }],
  creator: "Travel Pro",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Travel Pro",
    title: "Travel Pro — AI-Powered Trip Planning",
    description:
      "Plan your dream multi-country trip in minutes with AI-powered itineraries.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Pro — AI-Powered Trip Planning",
    description:
      "Plan your dream multi-country trip in minutes with AI-powered itineraries.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('theme') === 'dark') {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} ${grotesk.variable} font-sans antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <Providers>
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
