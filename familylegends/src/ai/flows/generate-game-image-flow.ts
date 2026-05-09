'use server';
/**
 * @fileOverview A flow to generate a game cover image from a game name.
 *
 * - generateGameImage - A function that takes a game name and returns an image data URI.
 */

import { ai } from '@/ai/genkit';
import { GenerateGameImageInputSchema, type GenerateGameImageInput, type GenerateGameImageOutput } from './schemas';

const imageGenerationPrompt = ai.definePrompt({
  name: 'gameImageGenerationPrompt',
  input: { schema: GenerateGameImageInputSchema },
  prompt: `Generate a dramatic and high-quality game cover art for a game titled '{{name}}'. The cover should be visually appealing, professional, and suitable for a gaming community website. Focus on creating an iconic image that represents the essence of the game. Do not include any text, titles, or logos on the image.`,
});


export async function generateGameImage(
  input: GenerateGameImageInput
): Promise<GenerateGameImageOutput> {
  const { media } = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: await imageGenerationPrompt.render(input),
  });

  if (!media || !media.url) {
    throw new Error('Image generation failed to produce a data URI.');
  }

  return { imageUrl: media.url };
}
