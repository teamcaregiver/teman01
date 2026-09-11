// React Query hooks over the Supabase read layer (src/lib/db.ts).
// Each list hook returns the same array shape the UI used to import from
// mock-data, so components swap a top-level import for a hook call and keep
// their rendering logic. Results are deduped/cached by React Query and scoped
// by RLS to the logged-in user.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Caregiver } from "@/lib/mock-data";
import * as db from "@/lib/db";

const STALE = 30_000;

export const qk = {
  users: ["users"] as const,
  parents: ["parents"] as const,
  medications: ["medications"] as const,
  caregivers: ["caregivers"] as const,
  trackers: ["trackers"] as const,
  bookings: ["bookings"] as const,
  articles: ["articles"] as const,
  videos: ["videos"] as const,
};

export function useUsers() {
  return useQuery({ queryKey: qk.users, queryFn: db.fetchUsers, staleTime: STALE }).data ?? [];
}
export function useParents() {
  return useQuery({ queryKey: qk.parents, queryFn: db.fetchParents, staleTime: STALE }).data ?? [];
}
export function useMedications() {
  return useQuery({ queryKey: qk.medications, queryFn: db.fetchMedications, staleTime: STALE }).data ?? [];
}
export function useCaregivers() {
  return useQuery({ queryKey: qk.caregivers, queryFn: db.fetchCaregivers, staleTime: STALE }).data ?? [];
}
export function useTrackers() {
  return useQuery({ queryKey: qk.trackers, queryFn: db.fetchTrackers, staleTime: STALE }).data ?? [];
}
export function useBookings() {
  return useQuery({ queryKey: qk.bookings, queryFn: db.fetchBookings, staleTime: STALE }).data ?? [];
}
export function useArticles() {
  return useQuery({ queryKey: qk.articles, queryFn: db.fetchArticles, staleTime: STALE }).data ?? [];
}
export function useVideos() {
  return useQuery({ queryKey: qk.videos, queryFn: db.fetchVideos, staleTime: STALE }).data ?? [];
}

/** Inclusive ISO timestamp window for the dashboard record filters. */
export type DateRange = { from?: string; to?: string };

/**
 * Tracker records for a date window, as the full query object so callers can
 * render loading / error states. The range is part of the key and is applied in
 * the query itself, so switching filters refetches only that period.
 * Invalidating `qk.trackers` still matches every window (prefix match).
 */
export function useTrackersQuery(range: DateRange = {}) {
  return useQuery({
    queryKey: [...qk.trackers, range.from ?? "*", range.to ?? "*"],
    queryFn: () => db.fetchTrackersInRange(range.from, range.to),
    staleTime: STALE,
  });
}

/** Active parents as a full query object (loading / error aware). */
export function useParentsQuery() {
  return useQuery({ queryKey: qk.parents, queryFn: db.fetchParents, staleTime: STALE });
}

/** Bookings as a full query object (loading / error aware). */
export function useBookingsQuery() {
  return useQuery({ queryKey: qk.bookings, queryFn: db.fetchBookings, staleTime: STALE });
}

/** Articles as a full query object (loading / error aware). */
export function useArticlesQuery() {
  return useQuery({ queryKey: qk.articles, queryFn: db.fetchArticles, staleTime: STALE });
}

/** One resident by id — works for archived residents too, unlike the lists. */
export function useParentQuery(id: string) {
  return useQuery({
    queryKey: [...qk.parents, "detail", id],
    queryFn: () => db.fetchParentById(id),
    staleTime: STALE,
    enabled: !!id,
  });
}

/** Archived parents. Keyed under qk.parents so archiving invalidates both lists. */
export function useArchivedParentsQuery() {
  return useQuery({
    queryKey: [...qk.parents, "archived"],
    queryFn: db.fetchArchivedParents,
    staleTime: STALE,
  });
}

/** Service requests that are still unresolved (pending / confirmed / ongoing). */
export function useOpenBookingsQuery() {
  return useQuery({
    queryKey: [...qk.bookings, "open"],
    queryFn: db.fetchOpenBookings,
    staleTime: STALE,
  });
}

/** Lookup helper mirroring mock-data's getCaregiver(id). */
export function useGetCaregiver() {
  const caregivers = useCaregivers();
  return (id?: string): Caregiver | undefined =>
    id ? caregivers.find((c) => c.id === id) : undefined;
}

/** Invalidate one or more caches after a mutation. */
export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: readonly (readonly string[])[]) =>
    keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
}
