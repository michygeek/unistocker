import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1000;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const FREE_PLAN_DAILY_LIMIT = 50;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// Check if a cached forecast is still fresh (< 4h old)
export function isCacheFresh(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < CACHE_TTL_MS;
}

// Check & enforce daily AI call quota per organization
export async function checkRateLimit(organizationId: string | undefined | null): Promise<{ allowed: boolean; reason?: string }> {
  if (!organizationId) return { allowed: true };

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  // Count today's forecasts + stock predictions as a proxy for AI calls
  const [forecastCount, predictionCount] = await Promise.all([
    db.demandForecast.count({ where: { product: { organizationId }, createdAt: { gte: since } } }),
    db.stockPrediction.count({ where: { product: { organizationId }, createdAt: { gte: since } } }),
  ]);

  const total = forecastCount + predictionCount;
  if (total >= FREE_PLAN_DAILY_LIMIT) {
    return { allowed: false, reason: `Daily AI call limit (${FREE_PLAN_DAILY_LIMIT}) reached. Resets at midnight.` };
  }
  return { allowed: true };
}

// Call Claude and parse JSON response; retry once on parse failure
export async function callClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  feature: string
): Promise<T> {
  const client = getClient();

  async function attempt(): Promise<T> {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // Strip any accidental markdown fences
    const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean) as T;
  }

  try {
    return await attempt();
  } catch (err) {
    console.error(`[AI:${feature}] First attempt failed, retrying:`, err);
    try {
      return await attempt();
    } catch (err2) {
      console.error(`[AI:${feature}] Retry also failed:`, err2);
      throw err2;
    }
  }
}

// Streaming chat — returns AsyncIterable of text deltas
export async function* callClaudeStream(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): AsyncGenerator<string> {
  const client = getClient();

  const stream = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: systemPrompt,
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

export { MODEL, MAX_TOKENS };
