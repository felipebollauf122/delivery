import express, { Router } from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const router = Router();

app.use(express.json());

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), environment: "netlify-functions" });
});

// API routes
router.get("/location", async (req, res) => {
  try {
    // Get IP from request
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "";
    if (Array.isArray(ip)) ip = ip[0];
    ip = ip.split(',')[0].trim();

    // If local, use a sample IP or empty for current IP
    const url = ip && ip !== "::1" && ip !== "127.0.0.1" 
      ? `https://ipapi.co/${ip}/json/` 
      : `https://ipapi.co/json/`;

    console.log(`[Location] Fetching for IP: ${ip || 'self'}`);
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Location Error:", error);
    res.status(500).json({ error: "Failed to detect location" });
  }
});

router.get("/pix/status/:identifier", async (req, res) => {
  const { identifier } = req.params;
  const publicKey = process.env.POSEIDON_PUBLIC_KEY || "ugaslucas1_yyqmkpbk0oymzej9";
  const secretKey = process.env.POSEIDON_SECRET_KEY || "ig21cacc7jmmv5zntrkf588aofja6kcq5byhl2fp0ke14zu3eyblwlkjzvovzt2t";

  try {
    const response = await fetch(`https://app.poseidonpay.site/api/v1/gateway/pix/status/${identifier}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": publicKey,
        "x-secret-key": secretKey,
      }
    });

    const contentType = response.headers.get("content-type");
    let data: any;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn(`[Pix Status] Non-JSON response for ${identifier}:`, text);
      return res.status(response.status).json({ 
        status: text === "NOT_FOUND" ? "not_found" : "error",
        message: text 
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Pix Status Error:", error);
    res.status(500).json({ message: "Internal server error checking Pix status." });
  }
});

router.post("/pix/create", async (req, res) => {
  console.log("Netlify Function: POST /api/pix/create hit", req.body);
  const { identifier, amount, client, products } = req.body;

  const publicKey = process.env.POSEIDON_PUBLIC_KEY || "ugaslucas1_yyqmkpbk0oymzej9";
  const secretKey = process.env.POSEIDON_SECRET_KEY || "ig21cacc7jmmv5zntrkf588aofja6kcq5byhl2fp0ke14zu3eyblwlkjzvovzt2t";

  if (!publicKey || !secretKey) {
    return res.status(500).json({ 
      message: "API keys not configured on server." 
    });
  }

  try {
    const response = await fetch("https://app.poseidonpay.site/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": publicKey,
        "x-secret-key": secretKey,
      },
      body: JSON.stringify({
        identifier,
        amount,
        client,
        products,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day from now
        metadata: { provider: "Samella Doces Netlify" }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PoseidonPay API Error:", {
        status: response.status,
        data
      });
      return res.status(response.status).json(data);
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Pix Creation Error:", error);
    res.status(500).json({ message: "Internal server error during Pix creation." });
  }
});

router.post("/pixel/event", async (req, res) => {
  const pixelId = process.env.VITE_META_PIXEL_ID || "932283672875849";
  const accessToken = process.env.META_ACCESS_TOKEN || "EAAR3ZBCX8pFMBRKx6oAL1gCQEZBjxdReLHNDWwrr8yRTSpiPkzRuuZC1UZBwjv4yq9dQhNAoOK87x7LefTGp1hGEcwQyAYTNmtgAPAPsRKWHVeKMyOyywpWWZC4KDGMRwEMwBN5SJOpS5PDCdLWZCQUzKnZCZCxP6ZB6fINor93D6PuEglXTL6Vpb7S3xwLFE3AZDZD";

  if (!pixelId || !accessToken) {
    return res.status(200).json({ status: "skipped", message: "Pixel ID or Access Token not configured." });
  }

  const { eventName, eventData, userData } = req.body;
  console.log(`[Meta CAPI] Sending event: ${eventName}`, { pixelId, eventData });

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url: req.headers.referer || "",
            user_data: {
              client_ip_address: req.ip,
              client_user_agent: req.headers["user-agent"],
              ...userData
            },
            custom_data: eventData
          }
        ]
      })
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Meta CAPI Error:", error);
    res.status(500).json({ error: "Failed to send event to Meta CAPI" });
  }
});

app.use("/api", router);
app.use("/", router);
app.use(router);

export const handler = serverless(app);
