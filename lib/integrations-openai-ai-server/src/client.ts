import OpenAI from "openai";

const apiKey =
  process.env.OPENAI_API_KEY ??
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY must be set. Please add it to your environment secrets.",
  );
}

// OpenRouter keys start with "sk-or-v1" and require a different base URL.
// Regular OpenAI keys start with "sk-" and use OpenAI's default endpoint.
const isOpenRouter = apiKey.startsWith("sk-or-");

const baseURL = isOpenRouter
  ? "https://openrouter.ai/api/v1"
  : (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? undefined);

export const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
