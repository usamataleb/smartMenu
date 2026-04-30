/**
 * Azampay integration library
 * Docs: https://developerdocs.azampay.co.tz/
 */

const AZAMPAY_BASE_URL =
  process.env.AZAMPAY_ENV === "production"
    ? "https://checkout.azampay.co.tz"
    : "https://sandbox.azampay.co.tz";

const AUTH_URL =
  process.env.AZAMPAY_ENV === "production"
    ? "https://authenticator.azampay.co.tz/AppRegistration/GenerateToken"
    : "https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName: process.env.AZAMPAY_APP_NAME,
      clientId: process.env.AZAMPAY_CLIENT_ID,
      clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Azampay auth failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const token: string = data.data?.accessToken ?? data.accessToken;
  // Token typically valid for 1 hour
  cachedToken = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

export interface CollectionRequest {
  amount: number;       // TZS integer
  phone: string;        // e.g. "0712345678"
  externalId: string;   // our Payment.id
  provider: "AirtelTanzania" | "Tigo" | "Halopesa" | "Azampesa" | "MPESA";
  callbackUrl: string;
}

export interface CollectionResponse {
  success: boolean;
  transactionId: string;
  message: string;
}

export async function initiateCollection(req: CollectionRequest): Promise<CollectionResponse> {
  const token = await getToken();

  const res = await fetch(`${AZAMPAY_BASE_URL}/azampay/mno/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      accountNumber: req.phone,
      amount: String(req.amount),
      currency: "TZS",
      externalId: req.externalId,
      provider: req.provider,
      callbackUrl: req.callbackUrl,
      additionalProperties: {},
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Azampay collection failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return {
    success: data.success ?? true,
    transactionId: data.transactionId ?? req.externalId,
    message: data.message ?? "Payment initiated",
  };
}

/**
 * Verifies the Azampay webhook callback token header.
 * The header `x-callback-token` must match AZAMPAY_CALLBACK_TOKEN env var.
 */
export function verifyWebhookSignature(req: Request): boolean {
  const token = req.headers.get("x-callback-token");
  const expected = process.env.AZAMPAY_CALLBACK_TOKEN;
  if (!expected) return false; // misconfigured — reject
  return token === expected;
}

/**
 * Maps a phone prefix to an Azampay provider.
 * Tanzanian number formats: 06xx = Airtel, 07xx = Vodacom/M-Pesa, 065/067 = Tigo/Halotel
 */
export function detectProvider(phone: string): CollectionRequest["provider"] {
  const normalized = phone.replace(/^(\+255|255)/, "0");
  const prefix = normalized.slice(0, 3);
  if (["074", "075", "076"].includes(prefix)) return "MPESA";         // Vodacom / M-Pesa
  if (["067", "068"].includes(prefix)) return "Tigo";                  // Tigo
  if (["062"].includes(prefix)) return "Halopesa";                     // Halotel
  if (["078", "079"].includes(prefix)) return "AirtelTanzania";        // Airtel
  return "Azampesa";                                                    // fallback
}
