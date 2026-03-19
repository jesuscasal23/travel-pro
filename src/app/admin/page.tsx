"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

interface Stats {
  totalUsers: number;
  totalTrips: number;
  totalItineraries: number;
  recentUsers: number;
  recentTrips: number;
  generationsByStatus: Record<string, number>;
}

interface AdminUser {
  id: string;
  userId: string;
  nationality: string;
  homeAirport: string;
  travelStyle: string;
  interests: string[];
  isSuperUser: boolean;
  onboardingCompleted: boolean;
  tripCount: number;
  createdAt: string;
}

interface AdminTrip {
  id: string;
  tripType: string;
  region: string;
  destination: string | null;
  dateStart: string;
  dateEnd: string;
  travelers: number;
  itineraryCount: number;
  hasProfile: boolean;
  profileNationality: string | null;
  profileAirport: string | null;
  createdAt: string;
}

type Tab = "overview" | "users" | "trips";

async function adminFetcher(url: string) {
  const res = await fetch(url);
  if (res.status === 401) throw new Error("__redirect__");
  if (res.status === 403) throw new Error("Access denied. You need superuser privileges.");
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [usersPage, setUsersPage] = useState(1);
  const [tripsPage, setTripsPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const userSearchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tripSearchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [debouncedTripSearch, setDebouncedTripSearch] = useState("");

  const handleError = useCallback(
    (err: Error) => {
      if (err.message === "__redirect__") router.push("/login?next=/admin");
    },
    [router]
  );

  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<Stats>("/api/v1/admin/stats", adminFetcher, { onError: handleError });

  const usersKey =
    tab === "users"
      ? `/api/v1/admin/users?page=${usersPage}&limit=20${debouncedUserSearch ? `&search=${encodeURIComponent(debouncedUserSearch)}` : ""}`
      : null;
  const {
    data: usersData,
    error: usersError,
    isLoading: usersLoading,
  } = useSWR<{
    users: AdminUser[];
    total: number;
    page: number;
    totalPages: number;
  }>(usersKey, adminFetcher, { onError: handleError });

  const tripsKey =
    tab === "trips"
      ? `/api/v1/admin/trips?page=${tripsPage}&limit=20${debouncedTripSearch ? `&search=${encodeURIComponent(debouncedTripSearch)}` : ""}`
      : null;
  const {
    data: tripsData,
    error: tripsError,
    isLoading: tripsLoading,
  } = useSWR<{
    trips: AdminTrip[];
    total: number;
    page: number;
    totalPages: number;
  }>(tripsKey, adminFetcher, { onError: handleError });

  const error =
    statsError?.message !== "__redirect__"
      ? statsError?.message
      : usersError?.message !== "__redirect__"
        ? usersError?.message
        : tripsError?.message !== "__redirect__"
          ? tripsError?.message
          : null;
  const loading = tab === "overview" ? statsLoading : tab === "users" ? usersLoading : tripsLoading;
  const users = usersData?.users ?? [];
  const usersTotal = usersData?.total ?? 0;
  const usersTotalPages = usersData?.totalPages ?? 1;
  const trips = tripsData?.trips ?? [];
  const tripsTotal = tripsData?.total ?? 0;
  const tripsTotalPages = tripsData?.totalPages ?? 1;

  const handleUserSearch = (value: string) => {
    setUserSearch(value);
    clearTimeout(userSearchTimer.current);
    userSearchTimer.current = setTimeout(() => {
      setDebouncedUserSearch(value);
      setUsersPage(1);
    }, 300);
  };

  const handleTripSearch = (value: string) => {
    setTripSearch(value);
    clearTimeout(tripSearchTimer.current);
    tripSearchTimer.current = setTimeout(() => {
      setDebouncedTripSearch(value);
      setTripsPage(1);
    }, 300);
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
        {(["overview", "users", "trips"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-v2-navy text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Platform Overview
          </h2>
          {loading || !stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Users"
                  value={stats.totalUsers}
                  sub={`+${stats.recentUsers} this week`}
                />
                <StatCard
                  label="Total Trips"
                  value={stats.totalTrips}
                  sub={`+${stats.recentTrips} this week`}
                />
                <StatCard label="Itineraries" value={stats.totalItineraries} />
                <StatCard
                  label="Completed Generations"
                  value={stats.generationsByStatus.complete ?? 0}
                  sub={
                    stats.generationsByStatus.failed
                      ? `${stats.generationsByStatus.failed} failed`
                      : undefined
                  }
                />
              </div>
              {Object.keys(stats.generationsByStatus).length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Generation Status Breakdown
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(stats.generationsByStatus).map(([status, count]) => (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700"
                      >
                        <StatusDot status={status} />
                        <span className="text-gray-700 capitalize dark:text-gray-300">
                          {status}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Users ({usersTotal})
            </h2>
            <input
              type="text"
              placeholder="Search by nationality, airport, or ID..."
              value={userSearch}
              onChange={(e) => handleUserSearch(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        User
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Airport
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Style
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Trips
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Role
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800/50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.nationality}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.userId.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {user.homeAirport}
                        </td>
                        <td className="px-4 py-3 text-gray-700 capitalize dark:text-gray-300">
                          {user.travelStyle}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {user.tripCount}
                        </td>
                        <td className="px-4 py-3">
                          {user.isSuperUser ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              Super
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">User</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={usersPage}
                totalPages={usersTotalPages}
                onPageChange={setUsersPage}
              />
            </>
          )}
        </div>
      )}

      {/* Trips Tab */}
      {tab === "trips" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trips ({tripsTotal})
            </h2>
            <input
              type="text"
              placeholder="Search by destination, region, or ID..."
              value={tripSearch}
              onChange={(e) => handleTripSearch(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Destination
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Region
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Type
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Dates
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Travelers
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Itineraries
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800/50">
                    {trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {trip.destination ?? "Multi-city"}
                          </div>
                          {trip.hasProfile && trip.profileNationality && (
                            <div className="text-xs text-gray-500">
                              by {trip.profileNationality} traveler
                            </div>
                          )}
                          {!trip.hasProfile && <div className="text-xs text-gray-400">Guest</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {trip.region}
                        </td>
                        <td className="px-4 py-3 text-gray-700 capitalize dark:text-gray-300">
                          {trip.tripType.replace("-", " ")}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="text-xs">
                            {trip.dateStart} — {trip.dateEnd}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {trip.travelers}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {trip.itineraryCount}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {new Date(trip.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {trips.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No trips found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={tripsPage}
                totalPages={tripsTotalPages}
                onPageChange={setTripsPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "complete"
      ? "bg-green-400"
      : status === "failed"
        ? "bg-red-400"
        : status === "generating"
          ? "bg-blue-400"
          : "bg-gray-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
      >
        Next
      </button>
    </div>
  );
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 px-4 py-3 dark:bg-gray-800">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-600"
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 animate-pulse rounded bg-gray-100 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
