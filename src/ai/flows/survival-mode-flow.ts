'use server';
/**
 * @fileOverview 5-Minute Survival Mode — ultra-condensed revision notes
 * via OpenRouter (free).
 * Drop this file at: src/ai/flows/survival-mode-flow.ts
 *
 * Exported API is identical to the original — no changes needed elsewhere.
 */

import { z } from 'zod';
import { callOpenRouterJSON, FREE_MODELS, type OpenRouterMessage } from '@/ai/genkit';

// ─── Input / Output Schemas ───────────────────────────────────────────────────

const SurvivalModeInputSchema = z.object({
  textContent: z.string(),
  imageReference: z.string().optional(),
});

export type SurvivalModeInput = z.infer<typeof SurvivalModeInputSchema>;

const SurvivalModeOutputSchema = z.object({
  revisionSummary: z.string(),
  keyFormulas: z.array(z.string()),
  importantDefinitions: z.array(z.string()),
  criticalTheorems: z.array(z.string()),
});

export type SurvivalModeOutput = z.infer<typeof SurvivalModeOutputSchema>;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert exam strategist specializing in ultra-condensed revision notes for competitive exams.
Extract the most crucial information for rapid last-minute revision.

CRITICAL RULES:
- Use LaTeX for ALL math: $...$ for inline, $$...$$ for block equations.
- Subscripts: a_{n}, superscripts: x^{2}, fractions: \\frac{a}{b}, symbols: \\int, \\sum, \\alpha
- Be CONCISE — this is a 5-minute survival guide, not a textbook.
- Output ONLY valid JSON — no markdown, no explanation outside JSON.

Required JSON structure:
{
  "revisionSummary": "ultra-condensed 5-minute summary...",
  "keyFormulas": ["formula 1 with LaTeX", "..."],
  "importantDefinitions": ["Term: definition", "..."],
  "criticalTheorems": ["theorem name: statement", "..."]
}`;

// ─── Flow ─────────────────────────────────────────────────────────────────────

export async function survivalMode(input: SurvivalModeInput): Promise<SurvivalModeOutput> {
  SurvivalModeInputSchema.parse(input);

  const hasImage = !!input.imageReference;

  const userMessage: OpenRouterMessage = hasImage
    ? {
        role: 'user',
        content: [
          { type: 'text' as const, text: `Study Material:\n${input.textContent}` },
          {
            type: 'image_url' as const,
            image_url: { url: input.imageReference! },
          },
          {
            type: 'text' as const,
            text: 'Generate ultra-condensed 5-minute survival notes from the above material.',
          },
        ],
      }
    : {
        role: 'user',
        content: `Study Material:\n${input.textContent}\n\nGenerate ultra-condensed 5-minute survival notes.`,
      };

  const result = await callOpenRouterJSON<SurvivalModeOutput>(
    [{ role: 'system', content: SYSTEM_PROMPT }, userMessage],
    { models: hasImage ? FREE_MODELS.vision : FREE_MODELS.text, maxTokens: 3000 }
  );

  return SurvivalModeOutputSchema.parse(result);
}
