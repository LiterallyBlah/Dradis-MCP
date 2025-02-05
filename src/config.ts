import { z } from 'zod';

const ConfigSchema = z.object({
  DRADIS_URL: z.string().url(),
  DRADIS_API_TOKEN: z.string().min(1),
  DRADIS_DEFAULT_TEAM_ID: z.string().transform(Number).optional(),
  DRADIS_DEFAULT_TEMPLATE_ID: z.string().transform(Number).optional(),
  DRADIS_DEFAULT_TEMPLATE: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const config = {
    DRADIS_URL: process.env.DRADIS_URL,
    DRADIS_API_TOKEN: process.env.DRADIS_API_TOKEN,
    DRADIS_DEFAULT_TEAM_ID: process.env.DRADIS_DEFAULT_TEAM_ID,
    DRADIS_DEFAULT_TEMPLATE_ID: process.env.DRADIS_DEFAULT_TEMPLATE_ID,
    DRADIS_DEFAULT_TEMPLATE: process.env.DRADIS_DEFAULT_TEMPLATE,
  };

  try {
    return ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map(issue => issue.path.join('.'));
      throw new Error(
        `Missing or invalid configuration. Please set the following environment variables:\n` +
        `${missingFields.join('\n')}\n\n` +
        `Create a .env file with these variables or provide them when starting the server.`
      );
    }
    throw error;
  }
}
