import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export const updateItemQtySchema = z.object({
  quantity: z.number().int().nonnegative(), // 0 => remove
});
