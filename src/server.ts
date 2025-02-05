import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { DradisAPI } from './api';
import { ServerState, CreateVulnerabilitySchema, CreateProjectSchema } from './types';
import { loadConfig } from './config';

// Load configuration first
const config = loadConfig();

const server = new FastMCP({
  name: "Dradis MCP",
  version: "1.0.0",
});

// Server state
const state: ServerState = {};

// Initialize API client
const api = new DradisAPI(config);

// Helper function to format responses consistently
function formatResponse(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// Set Project Tool
server.addTool({
  name: "setProject",
  description: "Set the current Dradis project",
  parameters: z.object({
    projectId: z.number().positive("Project ID must be positive"),
  }),
  execute: async (args) => {
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    // Verify project exists before setting
    await api.getProjectDetails(args.projectId);
    state.projectId = args.projectId;
    
    return formatResponse({ message: `Project ID set to ${args.projectId}` });
  },
});

// Get Project Details Tool
server.addTool({
  name: "getProjectDetails",
  description: "Get details of the current Dradis project",
  parameters: z.object({}),
  execute: async () => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const details = await api.getProjectDetails(state.projectId);
    return formatResponse(details);
  },
});

// Create Project Tool
server.addTool({
  name: "createProject",
  description: "Create a new Dradis project",
  parameters: CreateProjectSchema,
  execute: async (args) => {
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const project = await api.createProject(args);
    state.projectId = project.id; // Automatically set as current project
    return formatResponse({ 
      message: `Project created successfully with ID ${project.id}`,
      project 
    });
  },
});

// Create Vulnerability Tool
server.addTool({
  name: "createVulnerability",
  description: "Create a new vulnerability in the current project",
  parameters: CreateVulnerabilitySchema,
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const result = await api.createVulnerability(state.projectId, args);
    return formatResponse({
      message: "Vulnerability created successfully",
      vulnerability: result
    });
  },
});

// Get Vulnerabilities Tool
server.addTool({
  name: "getVulnerabilities",
  description: "Get list of vulnerabilities in the current project. Returns 25 items per page.",
  parameters: z.object({
    page: z.number().positive("Page number must be positive").optional().describe("Optional page number for pagination"),
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const vulnerabilities = await api.getVulnerabilities(state.projectId, args.page);
    return formatResponse({
      page: args.page || 1,
      items_per_page: 25,
      vulnerabilities
    });
  },
});

// Get Vulnerability Tool
server.addTool({
  name: "getVulnerability",
  description: "Get a specific vulnerability from the current project",
  parameters: z.object({
    vulnerabilityId: z.number().positive("Vulnerability ID must be positive"),
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const vulnerability = await api.getVulnerability(state.projectId, args.vulnerabilityId);
    return formatResponse(vulnerability);
  },
});

// Update Vulnerability Tool
server.addTool({
  name: "updateVulnerability",
  description: "Update an existing vulnerability",
  parameters: z.object({
    issueId: z.number().positive("Issue ID must be positive"),
    ...CreateVulnerabilitySchema.shape,
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const { issueId, ...vulnerability } = args;
    const result = await api.updateVulnerability(state.projectId, issueId, vulnerability);
    return formatResponse({
      message: "Vulnerability updated successfully",
      vulnerability: result
    });
  },
});

server.start({
  transportType: "stdio",
});
