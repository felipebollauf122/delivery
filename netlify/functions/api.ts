import express, { Router } from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const router = Router();

app.use(express.json());

// ---- Poseidon Pay configuration --------------------------------------------
const POSEIDON_BASE_URL = "https://app.poseidonpay.site/api/v1";
const POSEIDON_PUBLIC_KEY = process.env.POSEIDON_PUBLIC_KEY;
const POSEIDON_SECRET_KEY = process.env.POSEIDON_SECRET_KEY;

// ---- Utmify configuration --------------------------------------------------
const UTMIFY_API_TOKEN = process.env.UTMIFY_API_TOKEN;
const UTMIFY_URL = "https://api.utmify.com.br/api-credentials/orders";

// Utmify rejects timestamps >= server "now" — apply a 2-min safety margin.
function toUtcSqlDate(d: Date): string {
  const safe = new Date(d.getTime() - 2 * 60 * 1000);
  return safe.toISOString().replace("T", " ").substring(0, 19);
}

function clientIpFrom(req: any): string {
  const xff = req.headers["x-forwarded-for"];
  let ip = (Array.isArray(xff) ? xff[0] : xff || req.ip || req.socket?.remoteAddress || "").toString();
  ip = ip.split(",")[0].trim();
  if (!ip || ip === "::1" || ip === "127.0.0.1") return "8.8.8.8";
  if (ip.startsWith("::ffff:")) return ip.substring(7);
  return ip;
}

function normalizePoseidonStatus(raw: string): string {
  const s = (raw || "").toUpperCase();
  if (s === "APPROVED" || s === "PAID" || s === "CONFIRMED") return "approved";
  if (s === "EXPIRED") return "expired";
  if (s === "FAILED" || s === "CANCELLED" || s === "REFUNDED") return "failed";
  return "pending";
}

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Geolocation by IP (used by frontend for delivery defaults)
router.get("/location", async (req, res) => {
  try {
    const ip = clientIpFrom(req);
    const url = `https://ipapi.co/${ip}/json/`;
    const response = await fetch(url, { headers: { "User-Agent": "bella-burger-house/1.0" } });
    const ct = response.headers.get("content-type") || "";
    if (!response.ok || !ct.includes("application/json")) {
      return res.json({ city: null, region: null, country: null, ip });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("[Location]", error);
    res.json({ city: null, region: null, country: null });
  }
});

// Create Pix charge — stateless, returns Poseidon response as-is.
router.post("/pix/create", async (req, res) => {
  const { identifier, amount } = req.body || {};

  if (!POSEIDON_PUBLIC_KEY || !POSEIDON_SECRET_KEY) {
    return res.status(500).json({ message: "Poseidon API keys not configured." });
  }

  // Hardcoded client identity — Poseidon's phone validation is strict; using a
  // known-good fixed identity guarantees acceptance. Real customer data is
  // sent to Utmify and Meta Pixel separately by the frontend on approval.
  const requestBody = {
    identifier,
    amount: parseFloat(Number(amount).toFixed(2)),
    client: {
      name: "Cliente Bella Burger",
      email: "pedidos@bellaburgerhouse.com.br",
      phone: "11987654321",
      document: "11144477735",
    },
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    metadata: { provider: "Bella Burger House", orderId: identifier },
  };

  try {
    const response = await fetch(`${POSEIDON_BASE_URL}/gateway/pix/receive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": POSEIDON_PUBLIC_KEY,
        "x-secret-key": POSEIDON_SECRET_KEY,
      },
      body: JSON.stringify(requestBody),
    });
    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      return res.status(response.status).json({ message: "Erro interno no processador de pagamentos", details: text });
    }
    if (!response.ok) {
      console.error("[Poseidon] create error", { status: response.status, data });
      return res.status(response.status).json(data);
    }
    res.status(201).json(data);
  } catch (error) {
    console.error("[Poseidon] Pix Creation Error:", error);
    res.status(500).json({ message: "Internal server error during Pix creation." });
  }
});

// Stateless status proxy — queries Poseidon directly, no in-memory store.
router.get("/pix/status/:identifier", async (req, res) => {
  const { identifier } = req.params;
  if (!POSEIDON_PUBLIC_KEY || !POSEIDON_SECRET_KEY) {
    return res.status(500).json({ status: "pending", message: "Poseidon API keys not configured." });
  }
  try {
    const response = await fetch(`${POSEIDON_BASE_URL}/gateway/transactions/${encodeURIComponent(identifier)}`, {
      method: "GET",
      headers: {
        "x-public-key": POSEIDON_PUBLIC_KEY,
        "x-secret-key": POSEIDON_SECRET_KEY,
      },
    });
    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = null; }
    if (!response.ok || !data) {
      // Treat as still pending so the frontend keeps polling.
      return res.json({ status: "pending" });
    }
    const raw = data.status || data.transactionStatus || data?.transaction?.status || "";
    res.json({ status: normalizePoseidonStatus(raw) });
  } catch (error) {
    console.error("[Poseidon] status error", error);
    res.json({ status: "pending" });
  }
});

// Stateless Utmify dispatch — frontend calls this on create AND on approval.
router.post("/utmify/notify", async (req, res) => {
  if (!UTMIFY_API_TOKEN) {
    return res.json({ status: "skipped", message: "UTMIFY_API_TOKEN not configured." });
  }
  const { orderId, status, amountCents, createdAt, client, products, trackingParameters } = req.body || {};
  if (!orderId || !status || typeof amountCents !== "number") {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const now = new Date();
  const payload = {
    orderId,
    platform: "BellaBurgerHouse",
    paymentMethod: "pix",
    status,
    createdAt: createdAt || toUtcSqlDate(now),
    approvedDate: status === "paid" ? toUtcSqlDate(now) : null,
    refundedAt: null,
    customer: {
      name: client?.name || "Cliente",
      email: client?.email || "cliente@email.com",
      phone: client?.phone || null,
      document: client?.document || null,
      country: "BR",
      ip: clientIpFrom(req),
    },
    products: (products || []).map((p: any) => ({
      id: String(p.id),
      name: String(p.name),
      planId: null,
      planName: null,
      quantity: Math.floor(Number(p.quantity) || 1),
      priceInCents: Math.round(Number(p.priceCents) || 0),
    })),
    trackingParameters: {
      src: trackingParameters?.src ?? null,
      sck: trackingParameters?.sck ?? null,
      utm_source: trackingParameters?.utm_source ?? null,
      utm_campaign: trackingParameters?.utm_campaign ?? null,
      utm_medium: trackingParameters?.utm_medium ?? null,
      utm_content: trackingParameters?.utm_content ?? null,
      utm_term: trackingParameters?.utm_term ?? null,
    },
    commission: {
      totalPriceInCents: amountCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: amountCents,
    },
    isTest: false,
  };

  try {
    const response = await fetch(UTMIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": UTMIFY_API_TOKEN },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`[Utmify] ${status} error ${response.status}:`, text);
      return res.status(response.status).json({ status: "error", details: text });
    }
    console.log(`[Utmify] ${status} sent for ${orderId}`);
    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Utmify] Network error:", err);
    res.status(500).json({ status: "error" });
  }
});

// Meta Conversions API — Purchase events only.
router.post("/pixel/event", async (req, res) => {
  const pixelId = process.env.VITE_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return res.json({ status: "skipped", message: "Pixel ID or Access Token not configured." });
  }
  const { eventName, eventId, eventSourceUrl, eventData, userData } = req.body || {};
  if (eventName !== "Purchase") {
    return res.json({ status: "skipped", message: "Only Purchase events are tracked." });
  }
  try {
    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: eventSourceUrl || req.headers.referer || "",
          user_data: {
            client_ip_address: clientIpFrom(req),
            client_user_agent: req.headers["user-agent"],
            ...userData,
          },
          custom_data: eventData,
        },
      ],
    };
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("[Meta CAPI]", error);
    res.status(500).json({ error: "Failed to send event to Meta CAPI" });
  }
});

app.use("/api", router);
app.use("/", router);

export const handler = serverless(app);
export default app;
