const PAYSTACK_API = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export interface PaystackInitResult {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
}

export interface PaystackVerifyResult {
  status: boolean;
  data: {
    status: string; // "success" | "failed" | "abandoned"
    reference: string;
    amount: number;
    customer: { email: string; customer_code: string };
    subscription?: { subscription_code: string; plan_code: string; next_payment_date: string };
    metadata?: Record<string, unknown>;
  };
}

export async function paystackInitialize(params: {
  email: string;
  amount: number;       // in kobo
  planCode?: string;    // Paystack plan code for recurring subscription
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<PaystackInitResult> {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amount,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  };
  if (params.planCode) body.plan = params.planCode;

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function paystackVerify(reference: string): Promise<PaystackVerifyResult> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });
  return res.json();
}
