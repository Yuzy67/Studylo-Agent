import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  GenerateDevOutputBody,
  GenerateFlashcardsBody,
} from "@workspace/api-zod";

const router = Router();

const DEV_PROMPTS: Record<string, string> = {
  prd: `Generate a comprehensive Product Requirements Document (PRD) for this project idea. Include: Executive Summary, Problem Statement, Target Users, Core Features (with detailed descriptions), User Flows, Success Metrics, and Out of Scope items. Format in clean Markdown.`,
  trd: `Generate a Technical Requirements Document (TRD) for this project idea. Include: Tech Stack recommendation with justification, System Architecture, Database Schema, API Endpoints, Security Considerations, Performance Requirements, and Deployment Strategy. Format in clean Markdown with code examples.`,
  prompt: `Generate a detailed AI prompt optimized for use with AI coding tools like Cursor, v0, Lovable, or Bolt. The prompt should be comprehensive enough to generate a full working application. Include: project description, tech stack, folder structure, key components, and any special requirements. Make it copy-paste ready.`,
  sitemap: `Generate a complete sitemap for this project. Include all pages, routes, sub-pages, and API endpoints. Format as a structured Markdown document with route paths and descriptions. Also include page relationships and navigation flow.`,
  "starter-code": `Generate production-ready starter code for this project. Include: main entry point, key component structure, routing setup, API client setup, and example components. Use React + Vite + Tailwind CSS + shadcn/ui. Make it immediately usable.`,
  all: `Generate a complete development blueprint for this project idea. Structure your response with clear sections: 1) AI Prompt (for Cursor/v0/Lovable/Bolt), 2) PRD (Product Requirements), 3) TRD (Technical Requirements), 4) Sitemap (all pages and routes), 5) Starter Code (React+Vite+Tailwind). Format everything in clean Markdown with code blocks.`,
};

const LANGUAGE_CONTEXT: Record<string, string> = {
  nextjs: "Use Next.js 14 App Router, TypeScript, Tailwind CSS, and shadcn/ui.",
  react: "Use React + Vite, TypeScript, Tailwind CSS, and shadcn/ui.",
  vue: "Use Vue 3 with Composition API, TypeScript, and Tailwind CSS.",
  vanilla: "Use vanilla HTML, CSS, and JavaScript. No frameworks.",
};

// POST /api/studylo/generate (SSE streaming)
router.post("/studylo/generate", async (req, res) => {
  const body = GenerateDevOutputBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { idea, outputType, language = "react" } = body.data;
  const prompt = DEV_PROMPTS[outputType] ?? DEV_PROMPTS.all;
  const langContext = LANGUAGE_CONTEXT[language] ?? LANGUAGE_CONTEXT.react;

  const systemPrompt = `You are Studylo's Dev Co-Pilot — a senior full-stack engineer and product strategist. ${langContext} Output in clean, professional Markdown with properly formatted code blocks. Be specific, practical, and production-ready.`;

  const userPrompt = `${prompt}\n\nProject idea: ${idea}`;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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
      res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
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
  const subjectContext = subject ? ` Subject: ${subject}.` : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Studylo's Flashcard Generator. Create study-ready flashcards from notes.${subjectContext} Return ONLY valid JSON — no markdown, no explanation.`,
        },
        {
          role: "user",
          content: `Create flashcards from these notes. Return JSON with this exact structure:
{
  "title": "deck title",
  "summary": "2-3 sentence summary",
  "flashcards": [{"front": "question", "back": "answer", "topic": "topic name"}],
  "keyTerms": ["term1", "term2"]
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
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

// GET /api/studylo/modes
router.get("/studylo/modes", (_req, res) => {
  res.json([
    {
      id: "study",
      label: "Study",
      description: "Step-by-step explanations for any subject",
      icon: "BookOpen",
    },
    {
      id: "research",
      label: "Research",
      description: "Deep research with cited reasoning",
      icon: "Search",
    },
    {
      id: "dev-tools",
      label: "Dev Tools",
      description: "Generate PRDs, TRDs, and boilerplate",
      icon: "Code2",
    },
    {
      id: "vibe-coder",
      label: "Vibe Coder",
      description: "AI prompts for Cursor, v0, Lovable",
      icon: "Zap",
    },
    {
      id: "notes",
      label: "Notes",
      description: "Summarize notes and create flashcards",
      icon: "FileText",
    },
  ]);
});

export default router;
