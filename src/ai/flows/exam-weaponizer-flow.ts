
'use server';
/**
 * @fileOverview An AI exam strategist that analyzes study material to predict exam questions,
 * weightage, important derivations, and strategic study suggestions.
 *
 * - examWeaponizer - A function that processes study material and generates exam intelligence.
 * - ExamWeaponizerInput - The input type for the examWeaponizer function.
 * - ExamWeaponizerOutput - The return type for the examWeaponizer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExamWeaponizerInputSchema = z.object({
  text: z.string().describe('The primary text content of the study material.'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An optional image of study material, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentTextContent: z
    .string()
    .optional()
    .describe('Optional text content extracted from documents like PDFs or PPTX files.'),
});
export type ExamWeaponizerInput = z.infer<typeof ExamWeaponizerInputSchema>;

const ExamWeaponizerOutputSchema = z.object({
  probableQuestions: z
    .array(z.string())
    .min(10)
    .max(10)
    .describe('A list of 10 probable exam questions based on the study material.'),
  predictedWeightage: z
    .string()
    .describe(
      'The predicted weightage or importance of this topic in an exam (e.g., "High", "Medium", "Low", or a descriptive range).'
    ),
  importantDerivations: z
    .array(z.string())
    .describe('A list of important derivations, formulas, or step-by-step problem-solving methods.'),
  strategicStudySuggestions: z
    .array(z.string())
    .describe('A list of strategic study suggestions tailored to the provided material.'),
});
export type ExamWeaponizerOutput = z.infer<typeof ExamWeaponizerOutputSchema>;

export async function examWeaponizer(
  input: ExamWeaponizerInput
): Promise<ExamWeaponizerOutput> {
  return examWeaponizerFlow(input);
}

const examWeaponizerPrompt = ai.definePrompt({
  name: 'examWeaponizerPrompt',
  input: {schema: ExamWeaponizerInputSchema},
  output: {schema: ExamWeaponizerOutputSchema},
  prompt: `You are an expert AI Exam Strategist. Your task is to analyze the provided study material thoroughly and generate highly relevant, exam-focused intelligence.

CRITICAL: If the material contains any mathematical content (formulas, equations, variables, derivations), ALWAYS use standard LaTeX notation for ALL mathematical expressions. 
- Use $...$ for inline math (e.g., $E=mc^2$).
- Use $$...$$ for standalone block math equations.
- Ensure subscripts (a_{n}), superscripts (x^{2}), fractions (\frac{a}{b}), and special symbols (\int, \sum, \alpha) are rendered correctly in LaTeX.

Based on the content, identify and output:
1. **10 Probable Exam Questions**: These should be direct, challenging questions.
2. **Predicted Weightage**: Importance level (High/Medium/Low).
3. **Important Derivations**: Critical derivations, formulas, or step-by-step proofs.
4. **Strategic Study Suggestions**: Practical advice for retention.

Study Material for Analysis:
---
{{{text}}}
{{#if documentTextContent}}

Additional Extracted Text from Documents (PDF/PPTX):
---
{{{documentTextContent}}}
{{/if}}
{{#if imageDataUri}}

Visual Study Material Reference:
---
{{media url=imageDataUri}}
{{/if}}

Ensure your output adheres strictly to the JSON schema provided, with exactly 10 probable questions.`,
});

const examWeaponizerFlow = ai.defineFlow(
  {
    name: 'examWeaponizerFlow',
    inputSchema: ExamWeaponizerInputSchema,
    outputSchema: ExamWeaponizerOutputSchema,
  },
  async input => {
    const {output} = await examWeaponizerPrompt(input);
    if (!output) {
      throw new Error('AI did not return an output.');
    }
    return output;
  }
);
