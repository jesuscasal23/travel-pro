import { apiFetch, ApiError } from "@/lib/client/api-fetch";

export interface AdminStats {
  totalUsers: number;
  totalTrips: number;
  totalItineraries: number;
  recentUsers: number;
  recentTrips: number;
  buildsByStatus: Record<string, number>;
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

export interface AdminTrip {
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

interface AdminListResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  users?: T[];
  trips?: T[];
}

export interface AdminListParams {
  page: number;
  limit: number;
  search: string;
  enabled?: boolean;
}

export function shouldRetry(failureCount: number, error: unknown) {
  return (
    failureCount < 2 &&
    !(error instanceof ApiError && (error.status === 401 || error.status === 403))
  );
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/api/v1/admin/stats", {
    source: "useAdminStats",
    fallbackMessage: "Failed to load admin stats",
  });
}

export async function fetchAdminUsers(params: Omit<AdminListParams, "enabled">): Promise<{
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) searchParams.set("search", params.search);

  const data = await apiFetch<AdminListResponse<AdminUser>>(
    `/api/v1/admin/users?${searchParams.toString()}`,
    {
      source: "useAdminUsers",
      fallbackMessage: "Failed to load admin users",
    }
  );

  return {
    users: data.users ?? [],
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
  };
}

export async function fetchAdminTrips(params: Omit<AdminListParams, "enabled">): Promise<{
  trips: AdminTrip[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) searchParams.set("search", params.search);

  const data = await apiFetch<AdminListResponse<AdminTrip>>(
    `/api/v1/admin/trips?${searchParams.toString()}`,
    {
      source: "useAdminTrips",
      fallbackMessage: "Failed to load admin trips",
    }
  );

  return {
    trips: data.trips ?? [],
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
  };
}
