import { z } from "zod";
import { loadConfig } from "./config.js"

const config = loadConfig();
const createVulnParams = config.DRADIS_VULNERABILITY_PARAMETERS


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
export const CreateVulnerabilitySchema = createVulnParams.reduce((schema, param) => {
  return schema.extend({ [param]: z.string().nonempty(`${param} is required`) });  
}, z.object({}));


export type CreateVulnerabilityRequest = z.infer<typeof CreateVulnerabilitySchema>;

export const UpdateVulnerabilitySchema = createVulnParams.reduce((schema, param) => {
  return schema.extend({ [param]: z.string().optional() });  
}, z.object({}));

export type UpdateVulnerabilityRequest = z.infer<typeof CreateVulnerabilitySchema>;

export const VulnerabilitySchemaDefault = z.object({
  id: z.number(),
  author: z.string(),
  title: z.string(),
  fields: z.any(),
  text: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const VulnerabilitySchema = createVulnParams.reduce<z.ZodObject<any>>(
  (schema, param) => schema.extend({ [param]: z.string().optional() }),
  VulnerabilitySchemaDefault
);


export const VulnerabilityListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  fields: z.object({
    Rating: z.string(),
  }),
});


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

export const SimpleContentBlockSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
});

export const UpdateContentBlockSchema = z.object({
  block_group: z.string(),
  content: z.object({}).passthrough().refine(
    (val) => Object.keys(val).length > 0,
    { message: "Content must have at least one key-value pair" }
  ),
})

export type ContentBlockFields = z.infer<typeof ContentBlockFieldsSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type SimpleContentBlock = z.infer<typeof SimpleContentBlockSchema>;
export type UpdateContentBlock = z.infer<typeof UpdateContentBlockSchema>;

// Document Property Types
export const DocumentPropertySchema = z.record(z.string());
export type DocumentProperty = z.infer<typeof DocumentPropertySchema>;

// Schema for creating document properties, expects an object with property names as keys and their values as strings
// Example: { "dradis.client": "ACME Ltd.", "dradis.project": "Test Project" }
export const CreateDocumentPropertiesSchema = z.record(z.string()).describe('An object mapping property names to their values');
export type CreateDocumentProperties = z.infer<typeof CreateDocumentPropertiesSchema>;

// Server State Types
export interface ServerState {
  projectId?: number;
  apiToken?: string;
  dradisUrl?: string;
}
