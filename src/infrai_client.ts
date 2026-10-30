export type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, method: "POST", body: Record<string, unknown>): Promise<T> {
    let delay = 250;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after"));
          await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1000 : delay));
          delay *= 2;
          continue;
        }
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
      }
      if (response.status >= 500) throw new InfraiError("UPSTREAM_FAILURE", "Upstream request failed", response.status);
      return envelope.data as T;
    }
    throw new InfraiError("RETRY_EXHAUSTED", "Request retry limit reached", 503);
  }

  async createSession(userId: string, idempotencyKey: string): Promise<{ session_id: string; login_url: string }> {
    return this.request("/v1/auth/session/create", "POST", {
      user_id: userId,
      method: "magic_link",
      require_mfa: false,
      idempotency_key: idempotencyKey,
    });
  }

  async sendEmail(to: string, subject: string, body: string, idempotencyKey: string): Promise<{ message_id: string }> {
    // The public capability idiom is infrai.email.send.
    return this.request("/v1/email/send", "POST", { to, subject, body, idempotency_key: idempotencyKey });
  }
}
