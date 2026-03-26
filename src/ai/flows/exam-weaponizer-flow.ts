'use server';
/**
 * @fileOverview AI Exam Strategist — predicts exam questions, weightage,
 * derivations, and study suggestions via OpenRouter (free).
 * Drop this file at: src/ai/flows/exam-weaponizer-flow.ts
 *
 * Exported API is identical to the original — no changes needed elsewhere.
 */

import { z } from 'zod';
import { callOpenRouterJSON, FREE_MODELS, type OpenRouterMessage } from '@/ai/genkit';

// ─── Input / Output Schemas ───────────────────────────────────────────────────

const ExamWeaponizerInputSchema = z.object({
  text: z.string(),
  imageDataUri: z.string().optional(),
  documentTextContent: z.string().optional(),
});

export type ExamWeaponizerInput = z.infer<typeof ExamWeaponizerInputSchema>;

const ExamWeaponizerOutputSchema = z.object({
  probableQuestions: z.array(z.string()).min(10).max(10),
  predictedWeightage: z.string(),
  importantDerivations: z.array(z.string()),
  strategicStudySuggestions: z.array(z.string()),
});

export type ExamWeaponizerOutput = z.infer<typeof ExamWeaponizerOutputSchema>;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert AI Exam Strategist. Analyze the study material and generate exam intelligence.

CRITICAL RULES:
- Use LaTeX for ALL math: $...$ for inline, $$...$$ for block equations.
- Subscripts: a_{n}, superscripts: x^{2}, fractions: \\frac{a}{b}, symbols: \\int, \\sum, \\alpha
- Output ONLY valid JSON — no markdown, no preamble.
- probableQuestions must contain EXACTLY 10 items.

Required JSON structure:
{
  "probableQuestions": ["question 1", ..., "question 10"],
  "predictedWeightage": "High / Medium / Low with reasoning",
  "importantDerivations": ["derivation or formula 1", "..."],
  "strategicStudySuggestions": ["tip 1", "..."]
}`;

// ─── Flow ─────────────────────────────────────────────────────────────────────

export async function examWeaponizer(input: ExamWeaponizerInput): Promise<ExamWeaponizerOutput> {
  ExamWeaponizerInputSchema.parse(input);

  const hasImage = !!input.imageDataUri;

  // Compose text portion
  const textBlock = [
    `Primary Study Material:\n${input.text}`,
    input.documentTextContent
      ? `\nAdditional Document Content (PDF/PPTX):\n${input.documentTextContent}`
      : '',
  ].join('');

  const userMessage: OpenRouterMessage = hasImage
    ? {
        role: 'user',
        content: [
          { type: 'text' as const, text: textBlock },
          {
            type: 'image_url' as const,
            image_url: { url: input.imageDataUri! },
          },
          {
            type: 'text' as const,
            text: 'Analyze the above study material and generate exam intelligence with exactly 10 probable questions.',
          },
        ],
      }
    : {
        role: 'user',
        content: `${textBlock}\n\nGenerate exam intelligence with exactly 10 probable questions.`,
      };

  const result = await callOpenRouterJSON<ExamWeaponizerOutput>(
    [{ role: 'system', content: SYSTEM_PROMPT }, userMessage],
    { models: hasImage ? FREE_MODELS.vision : FREE_MODELS.text, maxTokens: 4096 }
  );

  return ExamWeaponizerOutputSchema.parse(result);
}
