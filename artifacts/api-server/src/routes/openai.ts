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

const SYSTEM_PROMPTS: Record<string, string> = {
  study: `You are Studylo's Academic Tutor — a patient, brilliant teacher for high school and university students. Break down complex topics step by step with clear language and real-world analogies. Format math using LaTeX ($...$). Be thorough, structured, and encouraging.`,
  research: `You are Studylo's Research Analyst — a rigorous researcher. Provide cited reasoning, balanced perspectives, clear sections, and suggest follow-up questions. Be thorough and academically rigorous.`,
  "dev-tools": `You are Studylo's Dev Co-Pilot — a senior full-stack engineer. Generate PRDs, TRDs, sitemaps, and production-ready code. Default stack: React + Vite, Tailwind, shadcn/ui. Output in clean Markdown with code blocks.`,
  "vibe-coder": `You are Studylo's Vibe Coder — a startup co-founder who helps indie hackers ship fast. Generate AI prompts for Cursor, v0, Lovable, and Bolt. Create PRDs, TRDs, and starter code. Be opinionated and practical.`,
  notes: `You are Studylo's Note Specialist. Summarize notes, extract key terms, identify core concepts, and generate study-ready content. Be concise and educational.`,
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
  const params = GetOpenaiConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.data.id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(messages.createdAt);
    res.json({
      id: conv.id,
      title: conv.title,
      mode: conv.mode,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /api/openai/conversations/:id
router.delete("/openai/conversations/:id", async (req, res) => {
  const params = DeleteOpenaiConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const deleted = await db
      .delete(conversations)
      .where(eq(conversations.id, params.data.id))
      .returning();
    if (!deleted.length) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /api/openai/conversations/:id/messages
router.get("/openai/conversations/:id/messages", async (req, res) => {
  const params = ListOpenaiMessagesParams.safeParse({
    id: Number(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);
    res.json(
      msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /api/openai/conversations/:id/messages (SSE streaming)
router.post("/openai/conversations/:id/messages", async (req, res) => {
  const params = SendOpenaiMessageParams.safeParse({
    id: Number(req.params.id),
  });
  const body = SendOpenaiMessageBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const conversationId = params.data.id;
  const userContent = body.data.content;
  const mode = normalizeMode(body.data.mode);

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save user message
    await db.insert(messages).values({ conversationId, role: "user", content: userContent });

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Build full history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.study;
    const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    // Save assistant message
    await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to stream message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Generation failed. Check your OPENAI_API_KEY." })}\n\n`);
      res.end();
    }
  }
});

export default router;
