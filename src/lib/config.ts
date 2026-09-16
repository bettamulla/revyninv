/**
 * Centralized env access with sane defaults.
 * APP_URL falls back to a runtime-detected value when not set in env,
 * so pay links work out of the box without configuration.
 */
function required(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

export const config = {
  /**
   * Returns APP_URL if set, otherwise tries to derive a sensible default.
   * On Vercel: uses VERCEL_PROJECT_PRODUCTION_URL when available.
   * Falls back to localhost for local dev.
   */
  get appUrl(): string {
    if (process.env.APP_URL) return process.env.APP_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return "http://localhost:3000";
  },
  authSecret: required("AUTH_SECRET", "dev-only-secret-please-replace-with-random-32-bytes"),
  dbPath: required("DB_PATH", "./data/payreview.db"),
  email: {
    from: required("EMAIL_FROM", "Pay & Review <hello@example.com>"),
    resendApiKey: process.env.RESEND_API_KEY || "",
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || "",
    smsFrom: process.env.TWILIO_SMS_FROM || "",
    enabled() {
      return Boolean(this.accountSid && this.authToken && this.whatsappFrom);
    },
  },
};

if (process.env.NODE_ENV === "production" && config.authSecret.startsWith("dev-only-")) {
  console.warn("[config] WARNING: AUTH_SECRET is set to the dev default. Set a strong secret in production env.");
}
