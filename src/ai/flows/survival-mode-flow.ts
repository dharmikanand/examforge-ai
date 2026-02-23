
'use server';
/**
 * @fileOverview A Genkit flow for the '5-Minute Survival Mode' in ExamForge AI.
 *
 * - survivalMode - A function that processes study material to generate ultra-condensed revision notes.
 * - SurvivalModeInput - The input type for the survivalMode function.
 * - SurvivalModeOutput - The return type for the survivalMode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SurvivalModeInputSchema = z.object({
  textContent: z.string().describe('The combined text content from all study materials (text, OCR from image, text from PDF).'),
  imageReference: z.string().optional().describe(
    "Optional: A photo of the study material, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Only provide if an image was originally uploaded and visual context is crucial."
  ),
});
export type SurvivalModeInput = z.infer<typeof SurvivalModeInputSchema>;

const SurvivalModeOutputSchema = z.object({
  revisionSummary: z.string().describe('An ultra-condensed revision summary of the provided study material.'),
  keyFormulas: z.array(z.string()).describe('A list of key formulas extracted from the study material.'),
  importantDefinitions: z.array(z.string()).describe('A list of important definitions extracted from the study material.'),
  criticalTheorems: z.array(z.string()).describe('A list of critical theorems extracted from the study material.'),
});
export type SurvivalModeOutput = z.infer<typeof SurvivalModeOutputSchema>;

export async function survivalMode(input: SurvivalModeInput): Promise<SurvivalModeOutput> {
  return survivalModeFlow(input);
}

const survivalModePrompt = ai.definePrompt({
  name: 'survivalModePrompt',
  input: {schema: SurvivalModeInputSchema},
  output: {schema: SurvivalModeOutputSchema},
  prompt: `You are an expert exam strategist and educator, specializing in creating ultra-condensed revision notes for competitive exams.
Your task is to analyze the provided study material and extract the most crucial information for rapid revision.

CRITICAL: If the material contains any mathematical content (formulas, equations, variables, derivations), ALWAYS use standard LaTeX notation for ALL mathematical expressions. 
- Use $...$ for inline math (e.g., $E=mc^2$).
- Use $$...$$ for standalone block math equations.
- Ensure subscripts (a_{n}), superscripts (x^{2}), fractions (\frac{a}{b}), and special symbols (\int, \sum, \alpha) are rendered correctly in LaTeX.

Focus on identifying and listing key formulas, important definitions, and critical theorems.
Finally, provide an overall ultra-condensed summary of the material.

Study Material Text:
{{{textContent}}}

{{#if imageReference}}
Visual Reference: {{media url=imageReference}}
{{/if}}

Please ensure the output is concise, accurate, and directly relevant for quick exam preparation.`,
});

const survivalModeFlow = ai.defineFlow(
  {
    name: 'survivalModeFlow',
    inputSchema: SurvivalModeInputSchema,
    outputSchema: SurvivalModeOutputSchema,
  },
  async (input) => {
    const {output} = await survivalModePrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a survival mode response.');
    }
    return output;
  }
);
