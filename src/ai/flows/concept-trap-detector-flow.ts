
'use server';
/**
 * @fileOverview A Genkit flow for detecting concept traps in study material.
 *
 * - conceptTrapDetector - A function that identifies common mistakes, misconceptions, and trick-based questions.
 * - ConceptTrapDetectorInput - The input type for the conceptTrapDetector function.
 * - ConceptTrapDetectorOutput - The return type for the conceptTrapDetector function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConceptTrapDetectorInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe(
      'The study material (text content from notes, images, or PDFs) to analyze for concept traps.'
    ),
});
export type ConceptTrapDetectorInput = z.infer<
  typeof ConceptTrapDetectorInputSchema
>;

const ConceptTrapDetectorOutputSchema = z.object({
  commonMistakes:
    z.array(z.string()).describe('A list of common mistakes related to the study material.'),
  misconceptions:
    z.array(z.string()).describe('A list of misconceptions frequently encountered with this topic.'),
  trickQuestions:
    z.array(z.string()).describe('A list of trick-based questions or tricky aspects related to the study material.'),
  frequentlyConfusedConcepts:
    z.array(z.string()).describe('A list of concepts that are often confused with each other.'),
  summary:
    z.string().describe('A brief summary of the overall concept traps identified.'),
});
export type ConceptTrapDetectorOutput = z.infer<
  typeof ConceptTrapDetectorOutputSchema
>;

export async function conceptTrapDetector(
  input: ConceptTrapDetectorInput
): Promise<ConceptTrapDetectorOutput> {
  return conceptTrapDetectorFlow(input);
}

const conceptTrapDetectorPrompt = ai.definePrompt({
  name: 'conceptTrapDetectorPrompt',
  input: {schema: ConceptTrapDetectorInputSchema},
  output: {schema: ConceptTrapDetectorOutputSchema},
  prompt: `You are an expert educator specializing in competitive exam preparation. Your task is to analyze the provided study material and identify potential "concept traps".

CRITICAL: If the material contains any mathematical content (formulas, equations, variables, derivations), ALWAYS use standard LaTeX notation for ALL mathematical expressions. 
- Use $...$ for inline math (e.g., $E=mc^2$).
- Use $$...$$ for standalone block math equations.
- Ensure subscripts (a_{n}), superscripts (x^{2}), fractions (\frac{a}{b}), and special symbols (\int, \sum, \alpha) are rendered correctly in LaTeX.

Analyze the following study material and output:
1.  **Common Mistakes**: Errors students frequently make.
2.  **Misconceptions**: Incorrect understandings students often hold.
3.  **Trick-Based Questions**: Ways this concept can be tested deceptively.
4.  **Frequently Confused Concepts**: Other concepts that are often mixed up with this one.
5.  **Summary**: A brief overview of the identified traps.

Study Material:
{{{studyMaterial}}}

Please provide your output in a structured JSON format matching the schema provided.`,
});

const conceptTrapDetectorFlow = ai.defineFlow(
  {
    name: 'conceptTrapDetectorFlow',
    inputSchema: ConceptTrapDetectorInputSchema,
    outputSchema: ConceptTrapDetectorOutputSchema,
  },
  async (input) => {
    const {output} = await conceptTrapDetectorPrompt(input);
    if (!output) {
      throw new Error('Failed to generate concept trap detection output.');
    }
    return output;
  }
);
