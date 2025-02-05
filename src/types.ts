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
export const CreateVulnerabilitySchema = z.object({
  text: z.string(),
});

export type CreateVulnerabilityRequest = z.infer<typeof CreateVulnerabilitySchema>;

export const VulnerabilityFieldsSchema = z.object({
  Title: z.string(),
  Rating: z.string(),
  Description: z.string(),
  Mitigation: z.string(),
  References: z.string(),
  Test: z.string(),
});

export const VulnerabilitySchema = z.object({
  id: z.number(),
  author: z.string(),
  title: z.string(),
  fields: VulnerabilityFieldsSchema,
  text: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const VulnerabilityListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export type VulnerabilityFields = z.infer<typeof VulnerabilityFieldsSchema>;
export type Vulnerability = z.infer<typeof VulnerabilitySchema>;
export type VulnerabilityListItem = z.infer<typeof VulnerabilityListItemSchema>;

// Server State Types
export interface ServerState {
  projectId?: number;
  apiToken?: string;
  dradisUrl?: string;
}
