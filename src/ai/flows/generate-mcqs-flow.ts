'use server';
/**
 * @fileOverview Generates MCQs from study material via OpenRouter (free).
 * Drop this file at: src/ai/flows/generate-mcqs-flow.ts
 *
 * Exported API is identical to the original — no changes needed elsewhere.
 */

import { z } from 'zod';
import { callOpenRouterJSON, FREE_MODELS, type OpenRouterMessage } from '@/ai/genkit';

// ─── Input / Output Schemas ───────────────────────────────────────────────────

const GenerateMcqsInputSchema = z.object({
  studyMaterialText: z.string().optional(),
  studyMaterialImage: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.studyMaterialText && !data.studyMaterialImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either studyMaterialText or studyMaterialImage must be provided.',
    });
  }
});

export type GenerateMcqsInput = z.infer<typeof GenerateMcqsInputSchema>;

const McqSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2).max(5),
  answer: z.string(),
  explanation: z.string(),
});

const GenerateMcqsOutputSchema = z.object({
  mcqs: z.array(McqSchema).min(10).max(15),
});

export type GenerateMcqsOutput = z.infer<typeof GenerateMcqsOutputSchema>;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert educator specializing in creating competitive exam questions.
Generate 10-15 multiple-choice questions (MCQs) based on the provided study material.

CRITICAL RULES:
- Use LaTeX for ALL math: $...$ for inline, $$...$$ for block equations.
- Subscripts: a_{n}, superscripts: x^{2}, fractions: \\frac{a}{b}, symbols: \\int, \\sum, \\alpha
- Output ONLY valid JSON — no markdown, no explanation outside JSON.

Required JSON structure:
{
  "mcqs": [
    {
      "question": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "answer": "option A",
      "explanation": "..."
    }
  ]
}`;

// ─── Flow ─────────────────────────────────────────────────────────────────────

export async function generateMcqs(input: GenerateMcqsInput): Promise<GenerateMcqsOutput> {
  GenerateMcqsInputSchema.parse(input);

  const hasImage = !!input.studyMaterialImage;

  // Build user message — multimodal if image is provided
  const userMessage: OpenRouterMessage = hasImage
    ? {
        role: 'user',
        content: [
          ...(input.studyMaterialText
            ? [{ type: 'text' as const, text: `Study Material Text:\n${input.studyMaterialText}` }]
            : []),
          {
            type: 'image_url' as const,
            image_url: { url: input.studyMaterialImage! },
          },
          { type: 'text' as const, text: 'Generate 10-15 MCQs from the above study material.' },
        ],
      }
    : {
        role: 'user',
        content: `Study Material:\n${input.studyMaterialText}\n\nGenerate 10-15 MCQs from the above.`,
      };

  const result = await callOpenRouterJSON<GenerateMcqsOutput>(
    [{ role: 'system', content: SYSTEM_PROMPT }, userMessage],
    { models: hasImage ? FREE_MODELS.vision : FREE_MODELS.text, maxTokens: 4096 }
  );

  return GenerateMcqsOutputSchema.parse(result);
}
