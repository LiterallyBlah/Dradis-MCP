// Configure TLS to accept self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { DradisAPI } from "./api.js";
import {
  ServerState,
  CreateVulnerabilitySchema,
  CreateProjectSchema,
  UpdateContentBlockSchema,
  CreateDocumentPropertiesSchema,
  UpdateVulnerabilitySchema,
} from "./types.js";
import { loadConfig } from "./config.js";
import https from "node:https";
// Removed node:console import - using built-in console for now

// Load configuration first
const config = loadConfig();

const server = new FastMCP({
  name: "Dradis MCP",
  version: "2.1.0",
  instructions: `This is a Model Context Protocol (MCP) server for Dradis Framework integration.

## Features
- Create and manage Dradis projects
- Create, read, and update vulnerabilities
- Manage content blocks and document properties
- Full CRUD operations for security assessment data

## Getting Started
1. First, set or create a project using 'setProject' or 'createProject'
2. Once a project is set, you can create vulnerabilities, manage content blocks, and update document properties
3. All operations are scoped to the currently selected project

## Key Tools
- **setProject**: Set the current project context (required before other operations)
- **createProject**: Create a new Dradis project
- **createVulnerability**: Add new security findings to the current project
- **getVulnerabilities**: List all vulnerabilities in the current project
- **updateVulnerability**: Modify existing vulnerability details
- **getContentBlocks**: Retrieve project content blocks
- **updateContentBlock**: Modify content block information
- **getDocumentProperties**: View project document properties
- **upsertDocumentProperty**: Create or update document properties

## Authentication
Requires DRADIS_URL and DRADIS_API_TOKEN environment variables to be configured.`,
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
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
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

    // If team_id wasn't provided in args, try to use the environment default
    if (!args.team_id && config.DRADIS_DEFAULT_TEAM_ID) {
      args.team_id = config.DRADIS_DEFAULT_TEAM_ID;
    }

    // Apply environment variable defaults for optional parameters
    const projectData = {
      ...args,
      report_template_properties_id:
        args.report_template_properties_id ?? config.DRADIS_DEFAULT_TEMPLATE_ID,
      template: args.template ?? config.DRADIS_DEFAULT_TEMPLATE,
    };

    const project = await api.createProject(projectData);
    state.projectId = project.id; // Automatically set as current project
    return formatResponse({
      message: `Project created successfully with ID ${project.id}`,
      project,
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
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const result = await api.createVulnerability(state.projectId, args);
    return formatResponse({
      message: "Vulnerability created successfully",
      vulnerability: result,
    });
  },
});

// Get Vulnerabilities Tool
server.addTool({
  name: "getVulnerabilities",
  description:
    "Get list of vulnerabilities in the current project. Returns 25 items per page.",
  parameters: z.object({
    page: z
      .number()
      .positive("Page number must be positive")
      .optional()
      .describe("Optional page number for pagination"),
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const vulnerabilities = await api.getVulnerabilities(
      state.projectId,
      args.page
    );
    return `${formatResponse({
      page: args.page || 1,
      items_per_page: 25,
      vulnerabilities,
    })}\n\nGenerate the results as a list of '<ID>: <Rating> - <title>'`;
  },
});

// Get All Vulnerability Details Tool
server.addTool({
  name: "getAllVulnerabilityDetails",
  description:
    "Get list of all vulnerability details in the current project. Returns 10 items per page.",
  parameters: z.object({
    page: z
      .number()
      .positive("Page number must be positive")
      .optional()
      .describe("Optional page number for pagination"),
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const vulnerabilities = await api.getAllVulnerabilityDetails(
      state.projectId,
      args.page
    );
    return `${formatResponse({
      page: args.page || 1,
      items_per_page: 25,
      vulnerabilities,
    })}\n\nGenerate the results as a list of '<ID>: <Rating> - <title>'`;
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
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const vulnerability = await api.getVulnerability(
      state.projectId,
      args.vulnerabilityId
    );
    return formatResponse(vulnerability);
  },
});

// Update Vulnerability Tool
server.addTool({
  name: "updateVulnerability",
  description: "Update an existing vulnerability",
  parameters: z.object({
    issueId: z.number().positive("Issue ID must be positive"),
    parameters: UpdateVulnerabilitySchema,
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    // const { issueId, ...vulnerability } = args;
    const result = await api.updateVulnerability(
      state.projectId,
      args.issueId,
      args.parameters
    );
    return formatResponse({
      message: "Vulnerability updated successfully",
      vulnerability: result,
    });
  },
});

// Get Content Blocks Tool
server.addTool({
  name: "getContentBlocks",
  description: "Get all content blocks in the current project",
  parameters: z.object({}),
  execute: async () => {
    if (!state.projectId) {
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const contentBlocks = await api.getContentBlocks(state.projectId);
    return `Output the content blocks in a list, with the ID followed by the fields (even empty fields with no values): ${formatResponse(
      contentBlocks
    )}`;
  },
});

// Update Content Block Tool
server.addTool({
  name: "updateContentBlock",
  description:
    "Update a content block in the current project. Provide the property and updated content in the contentBlock 'content' parameter",
  parameters: z.object({
    blockId: z.number().positive("Block ID must be positive"),
    contentBlock: UpdateContentBlockSchema,
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const block = await api.updateContentBlock(
      state.projectId,
      args.blockId,
      args.contentBlock
    );
    return formatResponse(block);
  },
});

// Get Document Properties Tool
server.addTool({
  name: "getDocumentProperties",
  description: "Get all document properties for the current project",
  parameters: z.object({}),
  execute: async () => {
    if (!state.projectId) {
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const properties = await api.getDocumentProperties(state.projectId);
    return `List the following properties with <name>: <value>. Don't change any details of the names and values: \n${formatResponse(
      properties
    )}`;
  },
});

server.addTool({
  name: "upsertDocumentProperty",
  description: "Create or update a document property in the current project",
  parameters: z.object({
    propertyName: z
      .string()
      .describe("The name of the property to create or update"),
    value: z.string().describe("The value to set for the property"),
  }),
  execute: async (args) => {
    if (!state.projectId) {
      throw new UserError(
        "No project ID set. Use setProject or createProject first."
      );
    }
    if (!api) {
      throw new UserError("API not initialized. Check your configuration.");
    }

    const property = await api.upsertDocumentProperty(
      state.projectId,
      args.propertyName,
      args.value
    );
    return formatResponse(property);
  },
});

// // Update Document Property Tool
// server.addTool({
//   name: "updateDocumentProperty",
//   description: "Update a document property in the current project",
//   parameters: z.object({
//     propertyName: z.string(),
//     value: z.string(),
//   }),
//   execute: async (args) => {
//     if (!state.projectId) {
//       throw new UserError("No project ID set. Use setProject or createProject first.");
//     }
//     if (!api) {
//       throw new UserError("API not initialized. Check your configuration.");
//     }

//     const property = await api.updateDocumentProperty(state.projectId, args.propertyName, args.value);
//     return formatResponse(property);
//   },
// });

// // Create Document Properties Tool
// server.addTool({
//   name: "createDocumentProperties",
//   description: "Create multiple document properties in the current project. Each property should be a key-value pair where the key is the property name (e.g. 'dradis.client') and the value is the property value (e.g. 'ACME Ltd.'). Example: {'properties': { 'dradis.client': 'ACME Ltd.', 'dradis.project': 'Test Project' }}",
//   parameters: z.object({
//     properties: z.record(z.string(), z.string()).describe('An object containing key-value pairs of property names and their values. Example: {"properties": { "dradis.client": "ACME Ltd.", "dradis.project": "Test Project" }}'),
//   }),
//   execute: async (args) => {
//     if (!state.projectId) {
//       throw new UserError("No project ID set. Use setProject or createProject first.");
//     }
//     if (!api) {
//       throw new UserError("API not initialized. Check your configuration.");
//     }

//     const properties = await api.createDocumentProperties(state.projectId, args.properties);
//     return formatResponse(properties);
//   },
// });

// Test API connection before starting server
async function testConnection() {
  try {
    console.log("🔌 Testing API connection...");
    await api.getProjectDetails(1);
    console.log("✅ API connection successful!");
    return true;
  } catch (error) {
    console.error("❌ API connection failed:", error);
    return false;
  }
}

// Server startup with improved logging and error handling
(async () => {
  try {
    console.log("🚀 Starting Dradis MCP server...");
    console.log("📊 Configuration summary:", {
      url: config.DRADIS_URL,
      hasToken: !!config.DRADIS_API_TOKEN,
      defaultTeamId: config.DRADIS_DEFAULT_TEAM_ID ?? "Not set",
      defaultTemplateId: config.DRADIS_DEFAULT_TEMPLATE_ID ?? "Not set",
      vulnerabilityParams: config.DRADIS_VULNERABILITY_PARAMETERS?.length ?? 0,
    });

    // Test connection is commented out to avoid blocking startup
    // const connected = await testConnection();
    const connected = true;

    if (connected) {
      console.log("🔗 Starting MCP server with stdio transport...");
      server.start({
        transportType: "stdio",
      });
      console.log("✅ Dradis MCP server started successfully!");
      console.log(
        "📝 Available tools: setProject, createProject, createVulnerability, getVulnerabilities, updateVulnerability, getContentBlocks, updateContentBlock, getDocumentProperties, upsertDocumentProperty"
      );
    } else {
      console.error("❌ Cannot start MCP server: API connection test failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    if (error instanceof Error) {
      console.error("📋 Error details:", error.message);
      if (process.env.NODE_ENV === "development") {
        console.error("🔍 Stack trace:", error.stack);
      }
    }
    process.exit(1);
  }
})();
