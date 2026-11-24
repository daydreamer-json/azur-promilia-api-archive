import { z } from 'zod';

export const LatestYmlSchema = z.object({
  version: z.string(),
  files: z.array(
    z.object({
      url: z.string(),
      sha512: z.string(),
      size: z.number(),
    }),
  ),
  path: z.string(),
  sha512: z.string(),
  releaseDate: z.string(),
});

export const ManifestSchema = z.object({
  source: z.string(),
  file: z.array(
    z.object({
      path: z.string(),
      hash: z.string(),
      size: z.string(),
    }),
  ),
});

export type LatestYml = z.infer<typeof LatestYmlSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
