"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserCircle, CalendarDays, Plane, Map, Brain, ShieldCheck, Layers } from "lucide-react";
import { WorldMapSVG } from "@/components/WorldMapSVG";

const features = [
  {
    icon: Brain,
    title: "AI Itinerary Generation",
    description:
      "Get a complete day-by-day plan tailored to your interests, pace, and travel style — generated in under 2 minutes.",
  },
  {
    icon: Map,
    title: "Smart Route Optimization",
    description:
      "We calculate the most logical, cost-efficient city order for multi-country trips so you never backtrack unnecessarily.",
  },
  {
    icon: ShieldCheck,
    title: "Visa & Weather Checks",
    description:
      "Instant visa requirement lookups for your passport across 227 destinations, plus expected weather for your travel dates.",
  },
  {
    icon: Layers,
    title: "Version-Controlled Edits",
    description:
      "Every edit refines your plan and builds on the last version. Drag-drop city reordering, regenerate anytime — nothing gets lost.",
  },
];

const testimonials = [
  {
    name: "Sarah K.",
    location: "London, UK",
    text: "Travel Pro planned our 3-week Southeast Asia trip in under 10 minutes. The visa alerts alone saved us from a major headache.",
    avatar: "SK",
  },
  {
    name: "Marco R.",
    location: "Berlin, Germany",
    text: "I've used dozens of trip planners. This is the first one that actually understands multi-country routing and budget constraints.",
    avatar: "MR",
  },
  {
    name: "Yuki T.",
    location: "Tokyo, Japan",
    text: "The day-by-day itinerary was incredibly detailed — local food spots, travel tips, even weather forecasts. Felt like having a personal travel agent.",
    avatar: "YT",
  },
];

const stats = [
  { value: "10,000+", label: "trips planned" },
  { value: "50+", label: "countries covered" },
  { value: "< 2 min", label: "average generation time" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Travel Pro",
  description: "AI-powered multi-country trip planning",
  applicationCategory: "TravelApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" as const },
  }),
};

const steps = [
  {
    icon: UserCircle,
    label: "Tell us about yourself",
    description: "Share your travel style, home airport, and passport. Takes 60 seconds.",
  },
  {
    icon: CalendarDays,
    label: "Set your trip parameters",
    description: "Pick your destinations, dates, budget, and number of travelers.",
  },
  {
    icon: Plane,
    label: "Get your itinerary instantly",
    description:
      "Receive a fully optimized day-by-day plan with visa info, weather, and budget breakdown.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24">
        {/* World map background */}
        <div className="absolute inset-0 opacity-30">
          <WorldMapSVG />
        </div>
        {/* Gradient overlay */}
        <div className="from-background/60 via-background/40 to-background absolute inset-0 bg-gradient-to-b" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="border-primary/30 bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          >
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            AI-powered travel planning — free to use
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-foreground text-4xl leading-tight font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Plan your{" "}
            <span className="to-accent bg-gradient-to-br from-[hsl(181_80%_35%)] bg-clip-text text-transparent dark:from-[hsl(181_80%_50%)] dark:to-[hsl(7_78%_65%)]">
              dream trip
            </span>{" "}
            in minutes, not weeks
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl"
          >
            Multi-country itineraries, visa requirements, weather, and budget — all generated by AI
            in under 2 minutes. No spreadsheets. No guesswork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/plan"
              className="btn-primary px-10 py-4 text-lg"
              style={{ boxShadow: "var(--shadow-hero)" }}
            >
              Start Planning — It&apos;s Free
            </Link>
            <a href="#how-it-works" className="text-primary font-medium hover:underline">
              See how it works ↓
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mt-4 text-sm"
          >
            No credit card required · No account needed to generate
          </motion.p>

          {/* Social proof avatars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex items-center justify-center gap-3"
          >
            <div className="flex -space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-background h-8 w-8 rounded-full border-2"
                  style={{
                    background: `hsl(${181 + i * 30} 60% ${45 + i * 8}%)`,
                  }}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-sm font-medium">
              Trusted by 10,000+ travelers worldwide
            </span>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-primary-foreground text-3xl font-bold sm:text-4xl">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/80 mt-1 text-sm font-medium tracking-wide uppercase">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="text-foreground text-3xl font-bold sm:text-4xl">
              Everything you need to plan with confidence
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
              From a first idea to a fully detailed itinerary — Travel Pro handles the research,
              routing, and logistics.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-travel bg-background hover:shadow-card-hover border-primary border-l-4 transition-shadow duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                    <f.icon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground text-lg font-semibold">{f.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-background py-24">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-foreground text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-md text-base">
              Three simple steps from idea to itinerary. No travel agent required.
            </p>
          </motion.div>

          <div className="relative mt-8 grid gap-10 md:grid-cols-3">
            {/* Dashed connector line (desktop only) */}
            <div
              className="absolute top-8 right-0 left-0 hidden h-px md:block"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, var(--primary) 0, var(--primary) 8px, transparent 8px, transparent 18px)",
                top: "2.75rem",
                left: "calc(16.66% + 2rem)",
                right: "calc(16.66% + 2rem)",
                opacity: 0.35,
              }}
            />

            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Numbered badge */}
                <div className="bg-primary text-primary-foreground z-10 mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-md">
                  {i + 1}
                </div>

                {/* Icon container */}
                <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <step.icon className="text-primary h-8 w-8" />
                </div>

                <h3 className="text-foreground mt-5 text-lg font-semibold">{step.label}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="text-foreground text-3xl font-bold sm:text-4xl">What Travelers Say</h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-md text-base">
              Real travelers. Real trips. No sponsored content.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-travel bg-background flex flex-col gap-4 p-8"
              >
                {/* Star rating */}
                <div className="flex gap-0.5 text-lg text-yellow-400" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span key={s}>★</span>
                  ))}
                </div>

                <p className="text-foreground text-base leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-foreground font-semibold">{t.name}</div>
                    <div className="text-muted-foreground text-sm">{t.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-foreground text-3xl font-bold sm:text-4xl">
              Ready to plan your next adventure?
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-base">
              Join thousands of travelers who use Travel Pro to plan smarter, not harder. Free,
              instant, and no account required.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/plan"
                className="btn-primary px-10 py-4 text-lg"
                style={{ boxShadow: "var(--shadow-hero)" }}
              >
                Start Planning
              </Link>
              <Link href="/dashboard" className="btn-ghost px-8 py-4 text-base">
                View sample trips →
              </Link>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Free to use · No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border border-t py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <span className="text-muted-foreground text-sm">
            © 2026 Travel Pro. AI-powered travel planning.
          </span>
          <div className="flex gap-6">
            {[
              { label: "About", href: "#" },
              { label: "Privacy", href: "/privacy" },
              { label: "Contact", href: "mailto:hello@travelpro.app" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
