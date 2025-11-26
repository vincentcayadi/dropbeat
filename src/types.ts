import { z } from 'zod';

// Zod schema for runtime validation
export const MetadataSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  artworkUrl: z.string().nullable(),
});

// TypeScript type inferred from Zod schema
export type Metadata = z.infer<typeof MetadataSchema>;
