import { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// CURSOR-BASED PAGINATION
// ---------------------------------------------------------------------------

export interface PaginationResult<T> {
  data: T[];
  nextCursor: string | null;
}

/**
 * Apply cursor-based pagination on a Supabase query builder.
 * Uses `created_at` as the cursor column (ISO string).
 *
 * @param query     - Supabase PostgREST query (already filtered/ordered)
 * @param cursor    - ISO timestamp string from the previous page's last item
 * @param limit     - Max rows to return (capped at 50)
 */
export const applyCursorPagination = <T>(
  rows: T[],
  limit: number
): PaginationResult<T> => {
  return {
    data: rows,
    nextCursor:
      rows.length === limit
        ? (rows[rows.length - 1] as any).created_at
        : null,
  };
};

// ---------------------------------------------------------------------------
// HASHTAG EXTRACTION (mirrors the old hashtagUtils.ts logic)
// ---------------------------------------------------------------------------

/**
 * Extract all hashtags from a block of text.
 * Returns lowercase tags without the '#' character.
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  // Deduplicate and lowercase
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
};

// ---------------------------------------------------------------------------
// LOCATION HELPERS
// ---------------------------------------------------------------------------

/**
 * Build a PostGIS WKT geography literal from lat/lng.
 * Used when inserting/updating location in demand_posts / rental_posts.
 *
 * PostgreSQL accepts this string directly as a geography value.
 */
export const toGeographyPoint = (lat: number, lng: number): string =>
  `SRID=4326;POINT(${lng} ${lat})`;

/**
 * Parse the location field from a row returned by a plain select.
 * Supabase returns geography as WKB hex by default; use the RPC functions
 * (get_nearby_demand_posts / get_nearby_rental_posts) to get lat/lng directly.
 * For rows fetched without the RPC, call this only if you added
 *   ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude
 * to your select projection — otherwise pass null.
 */
export const parseLatLng = (
  row: { latitude?: number | null; longitude?: number | null }
): { latitude: number; longitude: number } | null => {
  if (row.latitude == null || row.longitude == null) return null;
  return { latitude: row.latitude, longitude: row.longitude };
};
