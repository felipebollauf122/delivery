import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/location", async (req, res) => {
  try {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if (Array.isArray(ip)) ip = ip[0];
    ip = String(ip).split(",")[0].trim();

    const url =
      ip && ip !== "::1" && ip !== "127.0.0.1"
        ? `https://ipapi.co/${ip}/json/`
        : `https://ipapi.co/json/`;

    const response = await fetch(url, {
      headers: { "User-Agent": "pizzaria-bella-massa/1.0" },
    });
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.includes("application/json")) {
      console.warn(`[location] ipapi returned ${response.status} ${contentType}`);
      return res.json({ city: null, region: null, country: null, ip: ip || null });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Location Error:", error);
    res.json({ city: null, region: null, country: null });
  }
});

app.get("/api/pix/status/:identifier", async (req, res) => {
  const { identifier } = req.params;
  const publicKey = process.env.POSEIDON_PUBLIC_KEY;
  const secretKey = process.env.POSEIDON_SECRET_KEY;

  if (!publicKey || !secretKey) {
    return res.status(500).json({ message: "Poseidon API keys not configured." });
  }

  try {
    const response = await fetch(
      `https://app.poseidonpay.site/api/v1/gateway/pix/status/${identifier}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-public-key": publicKey,
          "x-secret-key": secretKey,
        },
      }
    );

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return res.json(data);
    }

    const text = await response.text();
    return res.status(response.status).json({
      status: text === "NOT_FOUND" ? "not_found" : "error",
      message: text,
    });
  } catch (error) {
    console.error("Pix Status Error:", error);
    res.status(500).json({ message: "Internal server error checking Pix status." });
  }
});

app.post("/api/pix/create", async (req, res) => {
  const { identifier, amount, products } = req.body;
  const publicKey = process.env.POSEIDON_PUBLIC_KEY;
  const secretKey = process.env.POSEIDON_SECRET_KEY;

  if (!publicKey || !secretKey) {
    return res.status(500).json({ message: "Poseidon API keys not configured." });
  }

  try {
    const fixedClient = {
      type: "individual",
      name: "Cliente Pix",
      email: "pix@pagamento.com",
      phone: "+5511999999999",
      document: "11144477735",
      address: {
        zipCode: "01001-000",
        street: "Praca da Se",
        number: "1",
        complement: "Sede",
        neighborhood: "Se",
        city: "Sao Paulo",
        state: "SP",
        country: "BR",
      },
    };

    const requestBody = {
      identifier,
      amount: parseFloat(Number(amount).toFixed(2)),
      client: fixedClient,
      products: (products || []).map((p: any) => ({
        id: String(p.id).substring(0, 50),
        name: String(p.name).substring(0, 100),
        quantity: Math.floor(Number(p.quantity) || 1),
        price: parseFloat(Number(p.price).toFixed(2)),
      })),
    };

    const response = await fetch(
      "https://app.poseidonpay.site/api/v1/gateway/pix/receive",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-public-key": publicKey,
          "x-secret-key": secretKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(response.status).json({
        message: "Erro interno no processador de pagamentos",
        details: text,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Pix Creation Error:", error);
    res.status(500).json({ message: "Internal server error during Pix creation." });
  }
});

app.post("/api/pixel/event", async (req, res) => {
  const pixelId = process.env.VITE_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return res.status(200).json({
      status: "skipped",
      message: "Pixel ID or Access Token not configured.",
    });
  }

  const { eventName, eventData, userData } = req.body;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
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
                ...userData,
              },
              custom_data: eventData,
            },
          ],
        })
      }
    );

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Meta CAPI Error:", error);
    res.status(500).json({ error: "Failed to send event to Meta CAPI" });
  }
});

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
