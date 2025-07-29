/**
 * @fileOverview Zod schemas for the generate model flow.
 * This file does not use 'use server' and can safely export Zod objects.
 *
 * - GenerateModelInput - The input type for the generateModel function.
 * - GenerateModelOutput - The return type for the generateModel function.
 */
import {z} from 'zod';

export const GenerateModelInputSchema = z.object({
  json: z.string().describe('The JSON string to convert.'),
  language: z.string().describe('The programming language for the output model.'),
});
export type GenerateModelInput = z.infer<typeof GenerateModelInputSchema>;

export const GenerateModelOutputSchema = z.object({
  code: z.string().describe('The generated code for the data model.'),
});
export type GenerateModelOutput = z.infer<typeof GenerateModelOutputSchema>;
