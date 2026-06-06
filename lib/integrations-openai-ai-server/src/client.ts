import OpenAI from "openai";

// Prefer the user's direct OPENAI_API_KEY. Only fall back to the Replit AI
// integration key when it comes paired with its own baseURL (e.g. OpenRouter).
const directKey = process.env.OPENAI_API_KEY;
const integrationKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const integrationBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

const hasValidIntegration = integrationKey && integrationBaseURL;

const apiKey = directKey ?? (hasValidIntegration ? integrationKey : undefined);
const baseURL = directKey ? undefined : (hasValidIntegration ? integrationBaseURL : undefined);

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY must be set. Please add it to your environment secrets.",
  );
}

export const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
