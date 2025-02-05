import { z } from "zod";

// Project Types
export const ProjectDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  // Add other project fields as needed
});

export type ProjectDetails = z.infer<typeof ProjectDetailsSchema>;

export const CreateProjectSchema = z.object({
  name: z.string(),
  team_id: z.number(),
  report_template_properties_id: z.number().optional(),
  author_ids: z.array(z.number()).optional(),
  template: z.string().optional(),
});

export type CreateProject = z.infer<typeof CreateProjectSchema>;

// Vulnerability Types
export const VulnerabilitySchema = z.object({
  text: z.string(),
});

export type Vulnerability = z.infer<typeof VulnerabilitySchema>;

// Server State Types
export interface ServerState {
  projectId?: number;
  apiToken?: string;
  dradisUrl?: string;
}
