import { z } from "zod";

// Project Types
export const ClientSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const UserSchema = z.object({
  email: z.string(),
});

export const CustomFieldSchema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.string(),
});

export const ProjectCreationStateSchema = z.object({
  state: z.enum(['being_created', 'completed']),
});

export const ProjectDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  client: ClientSchema,
  project_creation: ProjectCreationStateSchema.optional(),
  created_at: z.string(),
  updated_at: z.string(),
  authors: z.array(UserSchema),
  owners: z.array(UserSchema),
  custom_fields: z.array(CustomFieldSchema).optional(),
});

export type Client = z.infer<typeof ClientSchema>;
export type User = z.infer<typeof UserSchema>;
export type CustomField = z.infer<typeof CustomFieldSchema>;
export type ProjectCreationState = z.infer<typeof ProjectCreationStateSchema>;
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

// Content Block Types
export const ContentBlockFieldsSchema = z.record(z.string());

export const ContentBlockSchema = z.object({
  id: z.number(),
  author: z.string(),
  block_group: z.string(),
  title: z.string(),
  fields: ContentBlockFieldsSchema,
  content: z.string(),
});

export const UpdateContentBlockSchema = z.object({
  content: z.string(),
  block_group: z.string(),
});

export type ContentBlockFields = z.infer<typeof ContentBlockFieldsSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type UpdateContentBlock = z.infer<typeof UpdateContentBlockSchema>;

// Server State Types
export interface ServerState {
  projectId?: number;
  apiToken?: string;
  dradisUrl?: string;
}
