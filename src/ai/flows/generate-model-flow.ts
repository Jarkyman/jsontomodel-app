'use server';
/**
 * @fileOverview A flow for generating data models from JSON.
 *
 * - generateModel - A function that handles the model generation process.
 */

import {ai} from '@/ai/genkit';
import { GenerateModelInputSchema, GenerateModelOutputSchema, type GenerateModelInput, type GenerateModelOutput } from '@/ai/schemas/generate-model-schemas';


const prompt = ai.definePrompt({
  name: 'generateModelPrompt',
  input: {schema: GenerateModelInputSchema},
  output: {schema: GenerateModelOutputSchema},
  prompt: `You are an expert programmer. Convert the following JSON object into a data model for the {{language}} programming language.

Make sure to handle nested objects and arrays correctly. The output should be a single code block.

JSON:
\`\`\`json
{{{json}}}
\`\`\`
`,
});

const generateModelFlow = ai.defineFlow(
  {
    name: 'generateModelFlow',
    inputSchema: GenerateModelInputSchema,
    outputSchema: GenerateModelOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateModel(input: GenerateModelInput): Promise<GenerateModelOutput> {
  return generateModelFlow(input);
}
