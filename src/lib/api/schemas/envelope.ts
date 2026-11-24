import { z } from 'zod';

export function loose<T extends z.ZodRawShape>(shape: T): z.ZodObject<T, z.core.$catchall<z.ZodUnknown>> {
  return z.object(shape).catchall(z.unknown());
}

export function envelopeSchema<T>(
  data: z.ZodType<T>,
): z.ZodObject<{ code: z.ZodNumber; data: z.ZodType<T>; msg: z.ZodString }, z.core.$catchall<z.ZodUnknown>> {
  return z
    .object({
      code: z.number(),
      data,
      msg: z.string(),
    })
    .catchall(z.unknown());
}
