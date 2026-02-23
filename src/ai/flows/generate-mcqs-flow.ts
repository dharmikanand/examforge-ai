
'use server';
/**
 * @fileOverview A Genkit flow for generating multiple-choice questions (MCQs) from study material.
 *
 * - generateMcqs - A function that generates MCQs based on provided study material.
 * - GenerateMcqsInput - The input type for the generateMcqs function.
 * - GenerateMcqsOutput - The return type for the generateMcqs function, containing an array of MCQs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMcqsInputSchema = z.object({
  studyMaterialText: z.string().optional().describe('Text content of the study material.'),
  studyMaterialImage: z
    .string()
    .optional()
    .describe(
      "An image of the study material, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
  question: z.string().describe('The multiple-choice question.'),
  options: z.array(z.string()).min(2).max(5).describe('An array of possible answer options for the MCQ.'),
  answer: z.string().describe('The correct answer option (must be one of the options).'),
  explanation: z.string().describe('A short explanation for the correct answer.'),
});

const GenerateMcqsOutputSchema = z.object({
  mcqs: z.array(McqSchema).min(10).max(15).describe('An array of 10-15 multiple-choice questions of mixed difficulty.'),
});
export type GenerateMcqsOutput = z.infer<typeof GenerateMcqsOutputSchema>;

export async function generateMcqs(input: GenerateMcqsInput): Promise<GenerateMcqsOutput> {
  return generateMcqsFlow(input);
}

const mcqGenerationPrompt = ai.definePrompt({
  name: 'mcqGenerationPrompt',
  input: { schema: GenerateMcqsInputSchema },
  output: { schema: GenerateMcqsOutputSchema },
  prompt: `You are an expert educator specializing in creating competitive exam questions.
Your task is to generate 10-15 multiple-choice questions (MCQs) based on the provided study material.

CRITICAL: If the material contains any mathematical content (formulas, equations, variables, derivations), ALWAYS use standard LaTeX notation for ALL mathematical expressions in the question, the options, and the explanation. 
- Use $...$ for inline math (e.g., $E=mc^2$).
- Use $$...$$ for standalone block math equations.
- Ensure subscripts (a_{n}), superscripts (x^{2}), fractions (\frac{a}{b}), and special symbols (\int, \sum, \alpha) are rendered correctly in LaTeX.

Study Material:
{{#if studyMaterialText}}
Text:
{{{studyMaterialText}}}
{{/if}}

{{#if studyMaterialImage}}
Image: {{media url=studyMaterialImage}}
{{/if}}

Generate the output in JSON format, strictly adhering to the defined output schema.`,
});

const generateMcqsFlow = ai.defineFlow(
  {
    name: 'generateMcqsFlow',
    inputSchema: GenerateMcqsInputSchema,
    outputSchema: GenerateMcqsOutputSchema,
  },
  async (input) => {
    const { output } = await mcqGenerationPrompt(input);
    if (!output) {
      throw new Error('AI did not return any MCQs.');
    }
    return output;
  }
);
