import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GenerateDevOutputBody, GenerateFlashcardsBody } from "@workspace/api-zod";

const router = Router();

const DEV_PROMPTS: Record<string, string> = {
  prd: `Generate a comprehensive Product Requirements Document (PRD). Include: Executive Summary, Problem Statement, Target Users, Core Features (detailed), User Flows, Success Metrics, Out of Scope. Format in clean Markdown.`,
  trd: `Generate a Technical Requirements Document (TRD). Include: Tech Stack with justification, System Architecture, Database Schema, API Endpoints, Security Considerations, Performance Requirements, Deployment Strategy. Format in Markdown with code blocks.`,
  prompt: `Generate a detailed AI coding prompt ready to use with Cursor, v0, Lovable, or Bolt. Include: project description, tech stack, folder structure, key components, and special requirements. Make it comprehensive and copy-paste ready.`,
  sitemap: `Generate a complete sitemap. Include all pages, routes, sub-pages, and API endpoints as a structured Markdown document with route paths, descriptions, and navigation flow.`,
  "starter-code": `Generate production-ready starter code. Include: main entry point, component structure, routing, API client setup, and example components. Use React + Vite + Tailwind CSS + shadcn/ui. Make it immediately usable.`,
  all: `Generate a complete development blueprint with these clearly labelled sections:
# AI Prompt
(Optimized for Cursor/v0/Lovable/Bolt)

# Product Requirements Document (PRD)

# Technical Requirements Document (TRD)

# Sitemap

# Starter Code
(React + Vite + Tailwind CSS)`,
};

const LANGUAGE_CONTEXT: Record<string, string> = {
  nextjs: "Stack: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui.",
  react: "Stack: React 18 + Vite, TypeScript, Tailwind CSS, shadcn/ui.",
  vue: "Stack: Vue 3 Composition API, TypeScript, Tailwind CSS.",
  vanilla: "Stack: Vanilla HTML5, CSS3, JavaScript (ES modules, no framework).",
};

// POST /api/studylo/generate (SSE streaming)
router.post("/studylo/generate", async (req, res) => {
  const body = GenerateDevOutputBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { idea, outputType, language = "react" } = body.data;
  const outputPrompt = DEV_PROMPTS[outputType] ?? DEV_PROMPTS.all;
  const langCtx = LANGUAGE_CONTEXT[language] ?? LANGUAGE_CONTEXT.react;

  const systemPrompt = `You are Studylo's Dev Co-Pilot — a senior full-stack engineer and product strategist. ${langCtx} Output clean, professional Markdown with properly formatted code blocks. Be specific, practical, and production-ready.`;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${outputPrompt}\n\nProject idea: ${idea}` },
      ],
      stream: true,
      max_tokens: 8192,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to generate dev output");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate output" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Generation failed. Check your OPENAI_API_KEY." })}\n\n`);
      res.end();
    }
  }
});

// POST /api/studylo/flashcards
router.post("/studylo/flashcards", async (req, res) => {
  const body = GenerateFlashcardsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { notes, subject } = body.data;
  const subjectLine = subject ? ` Subject area: ${subject}.` : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Studylo's Flashcard Generator.${subjectLine} Create study-ready flashcards from the provided notes. Return ONLY valid JSON — no markdown fences, no preamble.`,
        },
        {
          role: "user",
          content: `Create flashcards and return this exact JSON structure:
{
  "title": "Deck title based on content",
  "summary": "2-3 sentence overview of the material",
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition", "topic": "Subtopic name" }
  ],
  "keyTerms": ["term1", "term2", "term3"]
}

Notes:
${notes}`,
        },
      ],
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(content);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate flashcards");
    res.status(500).json({ error: "Failed to generate flashcards. Check your OPENAI_API_KEY." });
  }
});

// GET /api/studylo/modes
router.get("/studylo/modes", (_req, res) => {
  res.json([
    { id: "study", label: "Study", description: "Step-by-step explanations for any subject", icon: "BookOpen" },
    { id: "research", label: "Research", description: "Deep research with cited reasoning", icon: "Search" },
    { id: "dev-tools", label: "Dev Tools", description: "Generate PRDs, TRDs, and boilerplate", icon: "Code2" },
    { id: "vibe-coder", label: "Vibe Coder", description: "AI prompts for Cursor, v0, Lovable", icon: "Zap" },
    { id: "notes", label: "Notes", description: "Summarize notes and create flashcards", icon: "FileText" },
  ]);
});

export default router;
