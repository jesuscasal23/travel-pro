"use client";

import {
  Calendar,
  CloudSun,
  ShieldCheck,
  Plane,
  Wallet,
  Shield,
  Package,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { BottomNav } from "@/components/v2/ui/BottomNav";
import { mockUserName, mockNextTrip, mockDepartureTasks } from "@/data/v2-mock-data";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-8 pb-4">
          <div>
            <p className="text-v2-text-muted text-sm">Good Morning,</p>
            <h1 className="text-v2-navy text-2xl font-bold">{mockUserName}</h1>
          </div>
          <div className="bg-v2-surface flex h-10 w-10 items-center justify-center rounded-full">
            <span className="text-lg">👤</span>
          </div>
        </div>

        {/* Next Trip Card */}
        <div className="relative mx-6 h-48 overflow-hidden rounded-2xl">
          <div className="from-v2-navy to-v2-navy-light absolute inset-0 bg-gradient-to-br" />
          <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-v2-orange rounded-full px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  NEXT TRIP
                </span>
                <span className="flex items-center gap-1 text-xs opacity-80">
                  <Calendar size={12} />
                  {mockNextTrip.daysAway} days away
                </span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs backdrop-blur-sm">
                <CloudSun size={12} />
                {mockNextTrip.weather.temp}°C {mockNextTrip.weather.condition}
              </span>
            </div>

            {/* Middle */}
            <p className="text-xl font-bold">{mockNextTrip.title}</p>

            {/* Bottom status pills */}
            <div className="flex gap-2">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
                <ShieldCheck size={14} className="text-green-300" />
                <span className="text-[10px]">VISA OK</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
                <Plane size={14} className="text-blue-300" />
                <span className="text-[10px]">FLIGHT</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
                <Wallet size={14} className="text-orange-300" />
                <span className="text-[10px]">BUDGET</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="mt-4 grid grid-cols-2 gap-3 px-6">
          {/* Risk Scanner */}
          <div className="border-v2-border rounded-xl border p-4">
            <Shield size={20} className="text-v2-green" />
            <p className="text-v2-navy mt-2 text-sm font-semibold">Risk Scanner</p>
            <p className="text-v2-text-muted text-xs">Safety Score: 98/100</p>
            <p className="text-v2-blue mt-1 text-xs font-medium">View Report &rarr;</p>
          </div>

          {/* Essentials */}
          <div className="border-v2-border rounded-xl border p-4">
            <Package size={20} className="text-v2-purple" />
            <p className="text-v2-navy mt-2 text-sm font-semibold">Essentials</p>
            <p className="text-v2-text-muted text-xs">eSIM, Insurance, etc.</p>
            <p className="text-v2-orange mt-1 text-xs font-medium">Bundle Checkout &rarr;</p>
          </div>
        </div>

        {/* Prepare for Departure */}
        <div className="mt-6 px-6">
          <h2 className="text-v2-navy mb-3 text-lg font-bold">Prepare for Departure</h2>

          {mockDepartureTasks.map((task) => (
            <div
              key={task.id}
              className="border-v2-border mb-3 flex items-center gap-4 rounded-xl border p-4"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  task.type === "packing" ? "bg-red-50" : "bg-blue-50"
                }`}
              >
                {task.type === "packing" ? (
                  <AlertCircle size={20} className="text-v2-red" />
                ) : (
                  <Plane size={20} className="text-v2-blue" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-v2-navy text-sm font-semibold">{task.title}</p>
                <p className="text-v2-text-muted text-xs">{task.subtitle}</p>
              </div>
              <ChevronRight size={18} className="text-v2-text-light" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
