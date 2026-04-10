/**
 * Meta Pixel Tracking Utility
 * 
 * This utility handles tracking events for Meta Pixel (formerly Facebook Pixel).
 * It uses the global `fbq` function injected by the Pixel script in index.html.
 */

export const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1310240047677060";

if (!import.meta.env.VITE_META_PIXEL_ID) {
  console.info('[Meta Pixel] Using fallback Pixel ID: 1310240047677060');
}

/**
 * Hashes a string using SHA-256 for Meta CAPI PII.
 */
async function hashData(data: string): Promise<string> {
  if (!data || typeof data !== 'string') return "";
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const msgUint8 = new TextEncoder().encode(data.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('[Meta Pixel] Crypto subtle not available or failed:', e);
  }
  return "";
}

/**
 * Gets the Facebook Click ID (fbc) from URL or cookie.
 */
export const getFbc = () => {
  if (typeof window === 'undefined') return "";
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      return `fb.1.${Date.now()}.${fbclid}`;
    }
    const match = document.cookie.match(/_fbc=([^;]+)/);
    return match ? match[1] : "";
  } catch (e) {
    return "";
  }
};

/**
 * Gets the Facebook Browser ID (fbp) from cookie.
 */
export const getFbp = () => {
  if (typeof window === 'undefined') return "";
  try {
    const match = document.cookie.match(/_fbp=([^;]+)/);
    return match ? match[1] : "";
  } catch (e) {
    return "";
  }
};

/**
 * Cleans a phone number for Meta Pixel (only digits, adds 55 if missing).
 */
export const cleanPhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 || cleaned.length === 10) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
};

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

/**
 * Tracks a standard Meta Pixel event.
 * @param eventName The name of the standard event (e.g., 'PageView', 'AddToCart', 'Purchase').
 * @param options Optional data to send with the event.
 * @param userData Optional user data for CAPI (e.g., email, phone).
 */
export const trackPixelEvent = async (eventName: string, options?: object, userData?: object) => {
  // Client-side tracking
  if (typeof window !== 'undefined' && typeof window.fbq === 'function' && PIXEL_ID) {
    try {
      window.fbq('track', eventName, options);
    } catch (e) {
      console.error('[Meta Pixel] Error calling fbq:', e);
    }
  } else {
    console.log(`[Meta Pixel] Event tracked (fallback): ${eventName}`, options || '');
  }

  // Server-side tracking (CAPI)
  try {
    const hashedUserData: any = {};
    if (userData) {
      const ud = userData as any;
      if (ud.em) hashedUserData.em = await hashData(ud.em);
      if (ud.ph) hashedUserData.ph = await hashData(ud.ph);
      if (ud.fn) hashedUserData.fn = await hashData(ud.fn);
      if (ud.ln) hashedUserData.ln = await hashData(ud.ln);
      if (ud.ct) hashedUserData.ct = await hashData(ud.ct);
      if (ud.st) hashedUserData.st = await hashData(ud.st);
      if (ud.zp) hashedUserData.zp = await hashData(ud.zp);
      if (ud.country) hashedUserData.country = await hashData(ud.country);
    }

    // Add fbc and fbp if available
    const fbc = getFbc();
    const fbp = getFbp();
    if (fbc) hashedUserData.fbc = fbc;
    if (fbp) hashedUserData.fbp = fbp;

    await fetch('/api/pixel/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, eventData: options, userData: hashedUserData })
    });
  } catch (err) {
    console.error('[Meta CAPI] Failed to send event:', err);
  }
};

/**
 * Tracks a custom Meta Pixel event.
 * @param eventName The name of the custom event.
 * @param options Optional data to send with the event.
 */
export const trackCustomPixelEvent = (eventName: string, options?: object) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function' && PIXEL_ID) {
    try {
      window.fbq('trackCustom', eventName, options);
    } catch (e) {
      console.error('[Meta Pixel] Error calling fbq (custom):', e);
    }
  } else {
    console.log(`[Meta Pixel] Custom event tracked (fallback): ${eventName}`, options || '');
  }
};
