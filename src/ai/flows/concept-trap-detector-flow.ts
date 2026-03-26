'use server';
/**
 * @fileOverview Detects concept traps in study material via OpenRouter (free).
 * Drop this file at: src/ai/flows/concept-trap-detector-flow.ts
 *
 * Exported API is identical to the original — no changes needed elsewhere.
 */

import { z } from 'zod';
import { callOpenRouterJSON, FREE_MODELS, type OpenRouterMessage } from '@/ai/genkit';

// ─── Input / Output Schemas ───────────────────────────────────────────────────

const ConceptTrapDetectorInputSchema = z.object({
  studyMaterial: z.string(),
});

export type ConceptTrapDetectorInput = z.infer<typeof ConceptTrapDetectorInputSchema>;

const ConceptTrapDetectorOutputSchema = z.object({
  commonMistakes: z.array(z.string()),
  misconceptions: z.array(z.string()),
  trickQuestions: z.array(z.string()),
  frequentlyConfusedConcepts: z.array(z.string()),
  summary: z.string(),
});

export type ConceptTrapDetectorOutput = z.infer<typeof ConceptTrapDetectorOutputSchema>;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert educator specializing in competitive exam preparation.
Analyze the provided study material and identify potential "concept traps".

CRITICAL RULES:
- Use LaTeX for ALL math: $...$ for inline, $$...$$ for block equations.
- Subscripts: a_{n}, superscripts: x^{2}, fractions: \\frac{a}{b}, symbols: \\int, \\sum, \\alpha
- Output ONLY valid JSON — no markdown, no explanation outside JSON.

Identify:
1. Common Mistakes — errors students frequently make.
2. Misconceptions — incorrect understandings students often hold.
3. Trick-Based Questions — ways this concept is tested deceptively.
4. Frequently Confused Concepts — concepts often mixed up with this one.
5. Summary — brief overview of all traps identified.

Required JSON structure:
{
  "commonMistakes": ["..."],
  "misconceptions": ["..."],
  "trickQuestions": ["..."],
  "frequentlyConfusedConcepts": ["..."],
  "summary": "..."
}`;

// ─── Flow ─────────────────────────────────────────────────────────────────────

export async function conceptTrapDetector(
  input: ConceptTrapDetectorInput
): Promise<ConceptTrapDetectorOutput> {
  ConceptTrapDetectorInputSchema.parse(input);

  const userMessage: OpenRouterMessage = {
    role: 'user',
    content: `Study Material:\n${input.studyMaterial}\n\nIdentify all concept traps in the above material.`,
  };

  const result = await callOpenRouterJSON<ConceptTrapDetectorOutput>(
    [{ role: 'system', content: SYSTEM_PROMPT }, userMessage],
    { models: FREE_MODELS.text, maxTokens: 3000 }
  );

  return ConceptTrapDetectorOutputSchema.parse(result);
}
