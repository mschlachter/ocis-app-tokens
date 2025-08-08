import { z } from 'zod';

export const AppTokensConfigSchema = z.object({
    enableCustomLabels: z.boolean()
})