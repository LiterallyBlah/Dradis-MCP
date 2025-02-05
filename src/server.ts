import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { DradisAPI } from './api';
import { ServerState, VulnerabilitySchema, CreateProjectSchema } from './types';
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

// Set Project Tool
server.addTool({
  name: "setProject",
  description: "Set the current Dradis project",
  parameters: z.object({
    projectId: z.number(),
  }),
  execute: async (args) => {
    state.projectId = args.projectId;
    return `Project ID set to ${args.projectId}`;
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
    return JSON.stringify(details, null, 2);
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
    return `Project created successfully with ID ${project.id}`;
  },
});

// Create Vulnerability Tool
server.addTool({
  name: "createVulnerability",
  description: "Create a new vulnerability in the current project",
  parameters: VulnerabilitySchema,
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const result = await api.createVulnerability(state.projectId, args);
    return `Vulnerability created successfully: ${JSON.stringify(result)}`;
  },
});

// Get Vulnerabilities Tool
server.addTool({
  name: "getVulnerabilities",
  description: "Get list of vulnerabilities in the current project",
  parameters: z.object({}),
  execute: async () => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const vulnerabilities = await api.getVulnerabilities(state.projectId);
    return JSON.stringify(vulnerabilities, null, 2);
  },
});

// Get Vulnerability Tool
server.addTool({
  name: "getVulnerability",
  description: "Get a specific vulnerability from the current project",
  parameters: z.object({
    vulnerabilityId: z.number(),
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError("No project ID set. Use setProject or createProject first.");
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const vulnerability = await api.getVulnerability(state.projectId, args.vulnerabilityId);
    return JSON.stringify(vulnerability, null, 2);
  },
});

// Update Vulnerability Tool
server.addTool({
  name: "updateVulnerability",
  description: "Update an existing vulnerability",
  parameters: z.object({
    issueId: z.number(),
    ...VulnerabilitySchema.shape,
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
    return `Vulnerability updated successfully: ${JSON.stringify(result)}`;
  },
});

server.start({
  transportType: "stdio",
});
