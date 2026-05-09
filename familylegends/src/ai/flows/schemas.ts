import { z } from 'genkit';

export const GenerateGameImageInputSchema = z.object({
  name: z.string().describe('The name of the game.'),
});
export type GenerateGameImageInput = z.infer<
  typeof GenerateGameImageInputSchema
>;

export const GenerateGameImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI.'),
});
export type GenerateGameImageOutput = z.infer<
  typeof GenerateGameImageOutputSchema
>;
