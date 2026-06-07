import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
  CreateOpenaiConversationBody,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Pick model per mode — research uses Perplexity Sonar (live web search)
const MODE_MODELS: Record<string, string> = {
  research: "perplexity/sonar",
  "vibe-coder": "openai/gpt-4o-mini",
  "dev-tools": "openai/gpt-4o-mini",
  notes: "openai/gpt-4o-mini",
  study: "openai/gpt-4o-mini",
};

function getModel(mode: string): string {
  return MODE_MODELS[mode] ?? "openai/gpt-4o-mini";
}

function today(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

const SYSTEM_PROMPTS: Record<string, string> = {
  study: `You are Studylo's Academic Tutor — a patient, brilliant teacher for high school and university students. Today is ${today()}. Break down complex topics step by step with clear language, real-world analogies, and examples. Format math using LaTeX ($...$). Be thorough, structured, and encouraging. Always check understanding at the end.`,

  research: `You are Studylo's Research Analyst with real-time internet access. Today is ${today()}. When a student asks about current events, news, or recent developments, search the web and provide up-to-date, accurate information with sources. For all topics: provide balanced perspectives, cite your sources, structure answers with clear sections (## headings), and suggest follow-up questions. Always mention if information is from the web or from your training data. Be rigorous and academically thorough.`,

  "dev-tools": `You are Studylo's Dev Co-Pilot — a senior full-stack engineer. Today is ${today()}. Generate PRDs, TRDs, sitemaps, and production-ready code. Default stack: React + Vite, Tailwind, shadcn/ui. Output in clean Markdown with code blocks. Stay current with latest framework versions and best practices.`,

  "vibe-coder": `You are Studylo's Vibe Coder — a startup co-founder who helps indie hackers ship fast. Today is ${today()}. Generate AI prompts for Cursor, v0, Lovable, and Bolt. Create PRDs, TRDs, and starter code. Be opinionated and practical. Reference the latest AI coding tools available.`,

  notes: `You are Studylo's Note Specialist. Today is ${today()}. Summarize notes, extract key terms, identify core concepts, and generate study-ready content. Be concise and educational.`,
};

function normalizeMode(mode: string | undefined | null): string {
  if (!mode) return "study";
  return mode.toLowerCase().replace(/\s+/g, "-");
}

// GET /api/openai/conversations
router.get("/openai/conversations", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));
    res.json(
      result.map((c) => ({
        id: c.id,
        title: c.title,
        mode: c.mode,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /api/openai/conversations
router.post("/openai/conversations", async (req, res) => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: parsed.data.title, mode: normalizeMode(parsed.data.mode) })
      .returning();
    res.status(201).json({
      id: conv.id,
      title: conv.title,
      mode: conv.mode,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/openai/conversations/:id
router.get("/openai/conversations/:id", async (req, res) => {
  const params = GetOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(messages.createdAt);
    res.json({
      id: conv.id, title: conv.title, mode: conv.mode,
      createdAt: conv.createdAt.toISOString(), updatedAt: conv.updatedAt.toISOString(),
      messages: msgs.map((m) => ({ id: m.id, conversationId: m.conversationId, role: m.role, content: m.content, createdAt: m.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /api/openai/conversations/:id
router.delete("/openai/conversations/:id", async (req, res) => {
  const params = DeleteOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const deleted = await db.delete(conversations).where(eq(conversations.id, params.data.id)).returning();
    if (!deleted.length) { res.status(404).json({ error: "Conversation not found" }); return; }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /api/openai/conversations/:id/messages
router.get("/openai/conversations/:id/messages", async (req, res) => {
  const params = ListOpenaiMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, params.data.id)).orderBy(messages.createdAt);
    res.json(msgs.map((m) => ({ id: m.id, conversationId: m.conversationId, role: m.role, content: m.content, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /api/openai/conversations/:id/messages (SSE streaming)
router.post("/openai/conversations/:id/messages", async (req, res) => {
  const params = SendOpenaiMessageParams.safeParse({ id: Number(req.params.id) });
  const body = SendOpenaiMessageBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const conversationId = params.data.id;
  const userContent = body.data.content;
  const mode = normalizeMode(body.data.mode);
  const model = getModel(mode);

  try {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    await db.insert(messages).values({ conversationId, role: "user", content: userContent });
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));

    const history = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.study;
    const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Signal which model is being used so the frontend can show a badge
    res.write(`data: ${JSON.stringify({ model, mode })}\n\n`);

    const stream = await openai.chat.completions.create({
      model,
      messages: chatMessages,
      stream: true,
      max_tokens: 4096,
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to stream message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Generation failed. Check your API key." })}\n\n`);
      res.end();
    }
  }
});

export default router;
