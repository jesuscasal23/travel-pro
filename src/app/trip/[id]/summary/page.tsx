"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, Share2, Download } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useItinerary } from "@/hooks/useItinerary";

type Params = Promise<{ id: string }>;

export default function SummaryPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);
  const itinerary = useItinerary();
  const { route, days, budget, visaData, weatherData } = itinerary;

  // Derive trip metadata
  const countries = [...new Set(route.map((r) => r.country))];
  const tripTitle = countries.join(", ");
  const totalDays = days.length;
  const firstDate = days[0]?.date ?? "";
  const lastDate = days[days.length - 1]?.date ?? "";

  const handleShareLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/trip/${id}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4">

        {/* Top action row */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/trip/${id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to itinerary
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={handleShareLink}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Copied!" : "Share Link"}
            </button>
          </div>
        </div>

        {/* Title block */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">{tripTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {firstDate} &ndash; {lastDate} &middot; {totalDays} days
          </p>
        </motion.div>

        {/* Route overview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 card-travel bg-background"
        >
          <h2 className="font-semibold text-foreground mb-4">Route</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {route.map((city, i) => (
              <div key={city.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">{city.city}</span>
                  <span className="text-xs text-muted-foreground">({city.days}d)</span>
                </div>
                {i < route.length - 1 && (
                  <Plane className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Day-by-day compact table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8"
        >
          <h2 className="font-semibold text-foreground mb-4">Day-by-Day Plan</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left px-4 py-3 font-medium text-foreground">Day</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">City</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground hidden sm:table-cell">
                    Activities
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.day} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{day.day}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{day.city}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {day.isTravel && (
                        <span className="text-primary text-xs mr-2">
                          ✈ {day.travelFrom} &rarr; {day.travelTo}
                        </span>
                      )}
                      <span className="text-xs">
                        {day.activities.map((a) => a.name).join(", ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Budget summary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 card-travel bg-background"
        >
          <h2 className="font-semibold text-foreground mb-4">Budget Breakdown</h2>
          <div className="space-y-2">
            {(Object.entries(budget) as [string, number][])
              .filter(([k]) => k !== "total" && k !== "budget")
              .map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="font-medium text-foreground">&euro;{value.toLocaleString()}</span>
                </div>
              ))}
          </div>
          <div className="pt-3 mt-2 border-t border-border flex justify-between">
            <span className="font-bold text-foreground">Total</span>
            <span className="font-bold text-foreground">&euro;{budget.total.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm text-primary font-medium">
            {budget.budget - budget.total > 0
              ? `✓ €${(budget.budget - budget.total).toLocaleString()} under budget`
              : `⚠ €${(budget.total - budget.budget).toLocaleString()} over budget`}
          </div>
        </motion.div>

        {/* Visa checklist card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 card-travel bg-background"
        >
          <h2 className="font-semibold text-foreground mb-4">Visa Requirements</h2>
          <div className="space-y-3">
            {visaData.map((visa) => (
              <div key={visa.countryCode} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{visa.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{visa.country}</span>
                    <span className="text-xs text-muted-foreground">{visa.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {visa.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weather overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="font-semibold text-foreground mb-4">Weather Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {weatherData.map((w) => (
              <div key={w.city} className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-2xl mb-1">{w.icon}</div>
                <div className="text-xs font-semibold text-foreground">{w.city}</div>
                <div className="text-sm font-bold text-primary mt-0.5">{w.temp}</div>
                <div className="text-xs text-muted-foreground">{w.condition}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Book Your Trip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8"
        >
          <h2 className="font-semibold text-foreground mb-4">Book Your Trip</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: "Flights", provider: "Skyscanner", emoji: "✈️", url: "https://www.skyscanner.com" },
              { name: "Hotels", provider: "Booking.com", emoji: "🏨", url: "https://www.booking.com" },
              { name: "Activities", provider: "GetYourGuide", emoji: "🎫", url: "https://www.getyourguide.com" },
            ].map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-all duration-200 group block"
              >
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="font-medium text-sm text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  {item.provider} &rarr;
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Generated by Travel Pro &mdash; travelpro.app</p>
          <p>Generated on {today}</p>
        </div>
      </div>

      {/* Clipboard toast */}
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 whitespace-nowrap"
        >
          Link copied!
        </motion.div>
      )}
    </div>
  );
}
