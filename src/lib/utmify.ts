/**
 * Stateless Utmify dispatch — fires "waiting_payment" on Pix create and
 * "paid" on approval polling. The backend forwards these to api.utmify.com.br.
 */

import { readStoredParameters } from "./tracking";

export type UtmifyClient = {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
};

export type UtmifyProduct = {
  id: string;
  name: string;
  quantity: number;
  priceCents: number;
};

export type UtmifyPayload = {
  orderId: string;
  status: "waiting_payment" | "paid" | "refused";
  amountCents: number;
  client: UtmifyClient;
  products: UtmifyProduct[];
  createdAt?: string;
};

export async function notifyUtmify(payload: UtmifyPayload): Promise<void> {
  try {
    await fetch("/api/utmify/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        trackingParameters: readStoredParameters(),
      }),
    });
  } catch (err) {
    console.error("[Utmify] dispatch failed", err);
  }
}
