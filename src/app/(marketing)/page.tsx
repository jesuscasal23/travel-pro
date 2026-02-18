"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserCircle, CalendarDays, Plane } from "lucide-react";
import { WorldMapSVG } from "@/components/WorldMapSVG";

const features = [
  {
    emoji: "🧠",
    title: "AI Itinerary Generation",
    description:
      "Get a complete day-by-day plan tailored to your interests and style",
  },
  {
    emoji: "🗺️",
    title: "Smart Route Optimization",
    description:
      "We calculate the most logical, cost-efficient city order for you",
  },
  {
    emoji: "🛂",
    title: "Visa & Budget Tracking",
    description:
      "Know your visa requirements and estimated costs before you book",
  },
];

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
    label: "Profile",
    description: "Tell us about your travel style",
  },
  {
    icon: CalendarDays,
    label: "Plan",
    description: "Choose dates, budget, and destinations",
  },
  {
    icon: Plane,
    label: "Itinerary",
    description: "Get your optimized itinerary instantly",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <WorldMapSVG />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-foreground"
          >
            Plan your dream trip in minutes, not weeks
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            AI-powered multi-country trip planning. From idea to optimized
            itinerary in under 30 minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/onboarding"
              className="btn-primary text-lg px-10 py-4"
              style={{ boxShadow: "var(--shadow-hero)" }}
            >
              Start Planning
            </Link>
            <a
              href="#how-it-works"
              className="text-primary font-medium hover:underline"
            >
              See how it works ↓
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            Free to use · No credit card required
          </motion.p>

          {/* Social proof */}
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
                  className="w-8 h-8 rounded-full border-2 border-background"
                  style={{
                    background: `hsl(${181 + i * 30} 60% ${45 + i * 8}%)`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Trusted by 10,000+ travelers
            </span>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-travel bg-background hover:shadow-card-hover transition-shadow duration-300"
              >
                <span className="text-3xl">{f.emoji}</span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center text-foreground"
          >
            How It Works
          </motion.h2>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="mt-2 text-xs font-semibold text-primary uppercase tracking-wider">
                  Step {i + 1}
                </div>
                <h3 className="mt-3 text-xl font-semibold text-foreground">
                  {step.label}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © 2026 Travel Pro. AI-powered travel planning.
          </span>
          <div className="flex gap-6">
            {["About", "Privacy", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
