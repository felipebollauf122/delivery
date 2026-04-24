/**
 * Meta Pixel — Purchase-only tracking.
 *
 * Sends a single `Purchase` event to both the browser Pixel and the server-side
 * Conversions API (CAPI), sharing the same `event_id` so Meta deduplicates them.
 */

export const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1310240047677060";

if (!import.meta.env.VITE_META_PIXEL_ID) {
  console.info('[Meta Pixel] Using fallback Pixel ID:', PIXEL_ID);
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

async function sha256(value: string): Promise<string> {
  if (!value) return "";
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
      const buf = new TextEncoder().encode(value.trim().toLowerCase());
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (e) {
    console.warn('[Meta Pixel] SHA-256 unavailable:', e);
  }
  return "";
}

export const getFbc = (): string => {
  if (typeof window === 'undefined') return "";
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
    const m = document.cookie.match(/_fbc=([^;]+)/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
};

export const getFbp = (): string => {
  if (typeof window === 'undefined') return "";
  try {
    const m = document.cookie.match(/_fbp=([^;]+)/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
};

export const cleanPhone = (phone: string): string => {
  let cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.length === 11 || cleaned.length === 10) cleaned = '55' + cleaned;
  return cleaned;
};

export type PurchaseItem = {
  id: string;
  quantity: number;
  price: number;
};

export type PurchaseCustomer = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  document?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type PurchaseInput = {
  transactionId: string;
  value: number;
  items: PurchaseItem[];
  customer: PurchaseCustomer;
};

/**
 * Fires the Purchase event to Meta Pixel (browser) and Meta CAPI (server),
 * sharing the same event_id for deduplication.
 *
 * Browser side sends raw user data — Meta hashes it.
 * Server side receives already-hashed PII for security.
 */
export const trackPurchase = async (input: PurchaseInput): Promise<void> => {
  const { transactionId, value, items, customer } = input;

  const contents = items.map(i => ({
    id: i.id,
    quantity: i.quantity,
    item_price: parseFloat(Number(i.price).toFixed(2)),
  }));
  const content_ids = items.map(i => i.id);
  const num_items = items.reduce((acc, i) => acc + i.quantity, 0);

  const customData = {
    value: parseFloat(Number(value).toFixed(2)),
    currency: 'BRL',
    content_type: 'product',
    content_ids,
    contents,
    num_items,
    order_id: transactionId,
  };

  const phone = cleanPhone(customer.phone || '');
  const document = (customer.document || '').replace(/\D/g, '');

  // ---- Browser Pixel (raw values; Meta hashes) ----
  if (typeof window !== 'undefined' && typeof window.fbq === 'function' && PIXEL_ID) {
    try {
      window.fbq(
        'track',
        'Purchase',
        customData,
        { eventID: transactionId },
      );
    } catch (e) {
      console.error('[Meta Pixel] fbq Purchase error:', e);
    }
  } else {
    console.log('[Meta Pixel] Purchase (fallback)', customData);
  }

  // ---- Server CAPI (hashed PII) ----
  try {
    const userData: Record<string, string> = {};
    if (customer.email)     userData.em          = await sha256(customer.email);
    if (phone)              userData.ph          = await sha256(phone);
    if (customer.firstName) userData.fn          = await sha256(customer.firstName);
    if (customer.lastName)  userData.ln          = await sha256(customer.lastName);
    if (document)           userData.external_id = await sha256(document);
    if (customer.city)      userData.ct          = await sha256(customer.city);
    if (customer.state)     userData.st          = await sha256(customer.state);
    if (customer.zip)       userData.zp          = await sha256(customer.zip.replace(/\D/g, ''));
    userData.country = await sha256(customer.country || 'br');

    const fbc = getFbc();
    const fbp = getFbp();
    if (fbc) userData.fbc = fbc;
    if (fbp) userData.fbp = fbp;

    await fetch('/api/pixel/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'Purchase',
        eventId: transactionId,
        eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
        eventData: customData,
        userData,
      }),
    });
  } catch (e) {
    console.error('[Meta CAPI] Purchase send failed:', e);
  }
};
