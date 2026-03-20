"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminStats, useAdminUsers, useAdminTrips, useDeleteAdminTrip } from "@/hooks/api";
import type { AdminStats as Stats, AdminTrip } from "@/hooks/api";
import { ApiError } from "@/lib/client/api-fetch";
import { StatCard } from "@/components/admin/StatCard";
import { StatusDot } from "@/components/admin/StatusDot";
import { Pagination } from "@/components/admin/Pagination";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

type Tab = "overview" | "users" | "trips";

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    if (error.status === 401) return null;
    if (error.status === 403) return "Access denied. You need superuser privileges.";
    return error.message;
  }
  return error instanceof Error ? error.message : "Request failed";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [usersPage, setUsersPage] = useState(1);
  const [tripsPage, setTripsPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const userSearchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tripSearchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [debouncedTripSearch, setDebouncedTripSearch] = useState("");
  const deleteTripMutation = useDeleteAdminTrip();

  const statsQuery = useAdminStats();
  const usersQuery = useAdminUsers({
    page: usersPage,
    limit: 20,
    search: debouncedUserSearch,
    enabled: tab === "users",
  });
  const tripsQuery = useAdminTrips({
    page: tripsPage,
    limit: 20,
    search: debouncedTripSearch,
    enabled: tab === "trips",
  });

  useEffect(() => {
    const authError = [
      statsQuery.error,
      usersQuery.error,
      tripsQuery.error,
      deleteTripMutation.error,
    ].find((error) => error instanceof ApiError && error.status === 401);

    if (authError) {
      router.push("/login?next=/admin");
    }
  }, [deleteTripMutation.error, router, statsQuery.error, tripsQuery.error, usersQuery.error]);

  const error =
    deleteError ??
    getErrorMessage(statsQuery.error) ??
    getErrorMessage(usersQuery.error) ??
    getErrorMessage(tripsQuery.error);
  const loading =
    tab === "overview"
      ? statsQuery.isLoading
      : tab === "users"
        ? usersQuery.isLoading
        : tripsQuery.isLoading;
  const stats: Stats | undefined = statsQuery.data;
  const users = usersQuery.data?.users ?? [];
  const usersTotal = usersQuery.data?.total ?? 0;
  const usersTotalPages = usersQuery.data?.totalPages ?? 1;
  const trips = tripsQuery.data?.trips ?? [];
  const tripsTotal = tripsQuery.data?.total ?? 0;
  const tripsTotalPages = tripsQuery.data?.totalPages ?? 1;

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

  const handleDeleteTrip = useCallback(
    async (trip: AdminTrip) => {
      const tripLabel = trip.destination ?? trip.region ?? trip.id;
      const confirmed = window.confirm(
        `Delete trip ${tripLabel}? This permanently removes the trip, its itineraries, and related data.`
      );

      if (!confirmed) {
        return;
      }

      setDeleteError(null);
      setDeletingTripId(trip.id);

      try {
        await deleteTripMutation.mutateAsync(trip.id);

        if (trips.length === 1 && tripsPage > 1) {
          setTripsPage((page) => Math.max(1, page - 1));
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login?next=/admin");
          return;
        }
        setDeleteError(getErrorMessage(err) ?? "Failed to delete trip.");
      } finally {
        setDeletingTripId(null);
      }
    },
    [deleteTripMutation, router, trips.length, tripsPage]
  );

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
          {deleteError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {deleteError}
            </div>
          )}
          {loading ? (
            <TableSkeleton rows={5} cols={8} />
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
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Actions
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
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleDeleteTrip(trip)}
                            disabled={deletingTripId !== null}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                          >
                            {deletingTripId === trip.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {trips.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
