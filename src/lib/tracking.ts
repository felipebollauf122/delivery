/**
 * UTM / tracking parameter capture.
 *
 * Reads tracking params from the current URL and persists them in
 * sessionStorage, so they survive client-side navigation between
 * landing page and checkout.
 */

const STORAGE_KEY = "tracking_params_v1";

const TRACKED_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
  "sck",
] as const;

export type TrackingParameters = Partial<Record<(typeof TRACKED_KEYS)[number], string | null>>;

export function captureTrackingParameters(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const stored: TrackingParameters = readStoredParameters();
    let dirty = false;
    for (const key of TRACKED_KEYS) {
      const value = params.get(key);
      if (value && stored[key] !== value) {
        stored[key] = value;
        dirty = true;
      }
    }
    if (dirty) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* sessionStorage may be blocked — silently ignore */
  }
}

export function readStoredParameters(): TrackingParameters {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackingParameters) : {};
  } catch {
    return {};
  }
}
