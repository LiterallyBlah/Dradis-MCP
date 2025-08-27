import { z } from "zod";
import { config as dotenvConfig } from "dotenv";

// Load environment variables from .env file
dotenvConfig();

const ConfigSchema = z.object({
  DRADIS_URL: z.string().url(),
  DRADIS_API_TOKEN: z.string().min(1),
  DRADIS_DEFAULT_TEAM_ID: z.string().transform(Number).optional(),
  DRADIS_DEFAULT_TEMPLATE_ID: z.string().transform(Number).optional(),
  DRADIS_DEFAULT_TEMPLATE: z.string().optional(),
  DRADIS_VULNERABILITY_PARAMETERS: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",") : [])),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  console.log("Loading configuration from environment variables...");

  const config = {
    DRADIS_URL: process.env.DRADIS_URL,
    DRADIS_API_TOKEN: process.env.DRADIS_API_TOKEN,
    DRADIS_DEFAULT_TEAM_ID: process.env.DRADIS_DEFAULT_TEAM_ID,
    DRADIS_DEFAULT_TEMPLATE_ID: process.env.DRADIS_DEFAULT_TEMPLATE_ID,
    DRADIS_DEFAULT_TEMPLATE: process.env.DRADIS_DEFAULT_TEMPLATE,
    DRADIS_VULNERABILITY_PARAMETERS:
      process.env.DRADIS_VULNERABILITY_PARAMETERS,
  };

  console.log("Environment variables found:", {
    DRADIS_URL: config.DRADIS_URL ? "✓" : "✗",
    DRADIS_API_TOKEN: config.DRADIS_API_TOKEN ? "✓" : "✗",
    DRADIS_DEFAULT_TEAM_ID: config.DRADIS_DEFAULT_TEAM_ID || "not set",
    DRADIS_DEFAULT_TEMPLATE_ID: config.DRADIS_DEFAULT_TEMPLATE_ID || "not set",
    DRADIS_DEFAULT_TEMPLATE: config.DRADIS_DEFAULT_TEMPLATE || "not set",
    DRADIS_VULNERABILITY_PARAMETERS:
      config.DRADIS_VULNERABILITY_PARAMETERS || "not set",
  });

  try {
    const parsed = ConfigSchema.parse(config);
    console.log("Configuration validation successful");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map((issue) => {
        const field = issue.path.join(".");
        const message = issue.message;
        return `  ${field}: ${message}`;
      });

      console.error("Configuration validation failed:");
      console.error(missingFields.join("\n"));

      throw new Error(
        `Missing or invalid configuration. Please check the following environment variables:\n` +
          `${missingFields.join("\n")}\n\n` +
          `Create a .env file with these variables or provide them when starting the server.\n` +
          `See .env.example for reference.`
      );
    }
    throw error;
  }
}
