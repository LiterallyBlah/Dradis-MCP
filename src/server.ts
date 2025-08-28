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
import express from "express";
import cors from "cors";
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
  description:
    "Set the current Dradis project context for all subsequent operations",
  parameters: z.object({
    projectId: z
      .number()
      .positive("Project ID must be positive")
      .describe("The ID of the Dradis project to set as current context"),
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
  description:
    "Get detailed information about the current Dradis project including metadata, team, and settings",
  parameters: z.object({
    includeMetadata: z
      .boolean()
      .optional()
      .describe(
        "Whether to include additional project metadata in the response"
      )
      .default(true),
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

    const details = await api.getProjectDetails(state.projectId);
    return formatResponse(details);
  },
});

// Create Project Tool
server.addTool({
  name: "createProject",
  description:
    "Create a new Dradis project with specified configuration and automatically set it as the current project context",
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
  description:
    "Create a new security vulnerability finding in the current project with detailed information",
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
    "Retrieve a paginated list of vulnerability summaries from the current project, including ID, title, and risk rating",
  parameters: z.object({
    page: z
      .number()
      .positive("Page number must be positive")
      .optional()
      .describe("Page number for pagination (25 items per page)")
      .default(1),
    includeFields: z
      .array(z.string())
      .optional()
      .describe("Specific vulnerability fields to include in the response"),
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
    "Retrieve a paginated list of complete vulnerability details including all fields and metadata from the current project",
  parameters: z.object({
    page: z
      .number()
      .positive("Page number must be positive")
      .optional()
      .describe("Page number for pagination (25 items per page)")
      .default(1),
    filterByRisk: z
      .enum(["Low", "Medium", "High", "Critical"])
      .optional()
      .describe("Filter vulnerabilities by risk rating"),
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
  description:
    "Retrieve complete details for a specific vulnerability including all fields, evidence, and metadata",
  parameters: z.object({
    vulnerabilityId: z
      .number()
      .positive("Vulnerability ID must be positive")
      .describe("The unique ID of the vulnerability to retrieve"),
    includeEvidence: z
      .boolean()
      .optional()
      .describe("Whether to include associated evidence in the response")
      .default(true),
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
  description:
    "Update an existing vulnerability with new information, modifying only the specified fields",
  parameters: z.object({
    issueId: z
      .number()
      .positive("Issue ID must be positive")
      .describe("The unique ID of the vulnerability to update"),
    parameters: UpdateVulnerabilitySchema.describe(
      "Vulnerability fields to update with new values"
    ),
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
  description:
    "Retrieve all content blocks from the current project, including their IDs and field data",
  parameters: z.object({
    blockGroup: z
      .string()
      .optional()
      .describe("Filter content blocks by their block group type"),
    includeContent: z
      .boolean()
      .optional()
      .describe("Whether to include full content in the response")
      .default(true),
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
    "Update a content block in the current project with new field values and content",
  parameters: z.object({
    blockId: z
      .number()
      .positive("Block ID must be positive")
      .describe("The unique ID of the content block to update"),
    contentBlock: UpdateContentBlockSchema.describe(
      "Content block data including block group and field updates"
    ),
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
  description:
    "Retrieve all document properties and their values for the current project configuration",
  parameters: z.object({
    propertyPrefix: z
      .string()
      .optional()
      .describe(
        "Filter properties by name prefix (e.g., 'dradis.' for system properties)"
      ),
    includeEmpty: z
      .boolean()
      .optional()
      .describe("Whether to include properties with empty values")
      .default(false),
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

    const properties = await api.getDocumentProperties(state.projectId);
    return `List the following properties with <name>: <value>. Don't change any details of the names and values: \n${formatResponse(
      properties
    )}`;
  },
});

server.addTool({
  name: "upsertDocumentProperty",
  description:
    "Create a new document property or update an existing property value in the current project",
  parameters: z.object({
    propertyName: z
      .string()
      .describe(
        "The name of the property to create or update (e.g., 'dradis.client', 'custom.field')"
      ),
    value: z.string().describe("The value to set for the property"),
    overwriteExisting: z
      .boolean()
      .optional()
      .describe("Whether to overwrite existing property values")
      .default(true),
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

// Create Express HTTP server for REST API endpoints
function createHTTPServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Helper function to handle async route errors
  const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // GET /getProjectDetails
  app.get(
    "/getProjectDetails",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const details = await api.getProjectDetails(state.projectId);
      res.json(details);
    })
  );

  // POST /getProjectDetails
  app.post(
    "/getProjectDetails",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const details = await api.getProjectDetails(state.projectId);
      res.json(details);
    })
  );

  // GET /getVulnerabilities
  app.get(
    "/getVulnerabilities",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const page = req.query.page
        ? parseInt(req.query.page as string)
        : undefined;
      const vulnerabilities = await api.getVulnerabilities(
        state.projectId,
        page
      );

      res.json({
        page: page || 1,
        items_per_page: 25,
        vulnerabilities,
      });
    })
  );

  // POST /getVulnerabilities
  app.post(
    "/getVulnerabilities",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const { page } = req.body;
      const vulnerabilities = await api.getVulnerabilities(
        state.projectId,
        page
      );

      res.json({
        page: page || 1,
        items_per_page: 25,
        vulnerabilities,
      });
    })
  );

  // GET /getAllVulnerabilityDetails
  app.get(
    "/getAllVulnerabilityDetails",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const page = req.query.page
        ? parseInt(req.query.page as string)
        : undefined;
      const vulnerabilities = await api.getAllVulnerabilityDetails(
        state.projectId,
        page
      );

      res.json({
        page: page || 1,
        items_per_page: 25,
        vulnerabilities,
      });
    })
  );

  // POST /getAllVulnerabilityDetails
  app.post(
    "/getAllVulnerabilityDetails",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const { page } = req.body;
      const vulnerabilities = await api.getAllVulnerabilityDetails(
        state.projectId,
        page
      );

      res.json({
        page: page || 1,
        items_per_page: 25,
        vulnerabilities,
      });
    })
  );

  // GET /getVulnerability
  app.get(
    "/getVulnerability",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const vulnerabilityId = parseInt(req.query.vulnerabilityId as string);
      if (!vulnerabilityId || vulnerabilityId <= 0) {
        return res
          .status(400)
          .json({ error: "Valid vulnerabilityId is required" });
      }

      const vulnerability = await api.getVulnerability(
        state.projectId,
        vulnerabilityId
      );
      res.json(vulnerability);
    })
  );

  // POST /getVulnerability
  app.post(
    "/getVulnerability",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const { vulnerabilityId } = req.body;
      if (!vulnerabilityId || vulnerabilityId <= 0) {
        return res
          .status(400)
          .json({ error: "Valid vulnerabilityId is required" });
      }

      const vulnerability = await api.getVulnerability(
        state.projectId,
        vulnerabilityId
      );
      res.json(vulnerability);
    })
  );

  // GET /getContentBlocks
  app.get(
    "/getContentBlocks",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const contentBlocks = await api.getContentBlocks(state.projectId);
      res.json(contentBlocks);
    })
  );

  // POST /getContentBlocks
  app.post(
    "/getContentBlocks",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const contentBlocks = await api.getContentBlocks(state.projectId);
      res.json(contentBlocks);
    })
  );

  // GET /getDocumentProperties
  app.get(
    "/getDocumentProperties",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const properties = await api.getDocumentProperties(state.projectId);
      res.json(properties);
    })
  );

  // POST /getDocumentProperties
  app.post(
    "/getDocumentProperties",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const properties = await api.getDocumentProperties(state.projectId);
      res.json(properties);
    })
  );

  // POST /setProject
  app.post(
    "/setProject",
    asyncHandler(async (req: any, res: any) => {
      const { projectId } = req.body;
      if (!projectId || projectId <= 0) {
        return res.status(400).json({ error: "Valid projectId is required" });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      // Verify project exists before setting
      await api.getProjectDetails(projectId);
      state.projectId = projectId;

      res.json({ message: `Project ID set to ${projectId}` });
    })
  );

  // POST /createProject
  app.post(
    "/createProject",
    asyncHandler(async (req: any, res: any) => {
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      let args = req.body;

      // If team_id wasn't provided in args, try to use the environment default
      if (!args.team_id && config.DRADIS_DEFAULT_TEAM_ID) {
        args.team_id = config.DRADIS_DEFAULT_TEAM_ID;
      }

      // Apply environment variable defaults for optional parameters
      const projectData = {
        ...args,
        report_template_properties_id:
          args.report_template_properties_id ??
          config.DRADIS_DEFAULT_TEMPLATE_ID,
        template: args.template ?? config.DRADIS_DEFAULT_TEMPLATE,
      };

      const project = await api.createProject(projectData);
      state.projectId = project.id; // Automatically set as current project

      res.json({
        message: `Project created successfully with ID ${project.id}`,
        project,
      });
    })
  );

  // POST /createVulnerability
  app.post(
    "/createVulnerability",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const result = await api.createVulnerability(state.projectId, req.body);
      res.json({
        message: "Vulnerability created successfully",
        vulnerability: result,
      });
    })
  );

  // POST /updateVulnerability
  app.post(
    "/updateVulnerability",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const { issueId, parameters } = req.body;
      if (!issueId || issueId <= 0) {
        return res.status(400).json({ error: "Valid issueId is required" });
      }

      const result = await api.updateVulnerability(
        state.projectId,
        issueId,
        parameters
      );
      res.json({
        message: "Vulnerability updated successfully",
        vulnerability: result,
      });
    })
  );

  // POST /updateContentBlock
  app.post(
    "/updateContentBlock",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const { blockId, contentBlock } = req.body;
      if (!blockId || blockId <= 0) {
        return res.status(400).json({ error: "Valid blockId is required" });
      }

      const block = await api.updateContentBlock(
        state.projectId,
        blockId,
        contentBlock
      );
      res.json(block);
    })
  );

  // POST /upsertDocumentProperty
  app.post(
    "/upsertDocumentProperty",
    asyncHandler(async (req: any, res: any) => {
      if (!state.projectId) {
        return res.status(400).json({
          error: "No project ID set. Use setProject or createProject first.",
        });
      }
      if (!api) {
        return res.status(500).json({
          error: "API not initialized. Check your configuration.",
        });
      }

      const { propertyName, value } = req.body;
      if (!propertyName || !value) {
        return res
          .status(400)
          .json({ error: "propertyName and value are required" });
      }

      const property = await api.upsertDocumentProperty(
        state.projectId,
        propertyName,
        value
      );
      res.json(property);
    })
  );

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error("HTTP server error:", error);
    if (error instanceof UserError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
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
      // Check if we should run in HTTP mode or stdio mode
      const runMode = process.env.DRADIS_MCP_MODE || "stdio";

      if (runMode === "http") {
        const port = parseInt(process.env.PORT || "3000");
        console.log(`🔗 Starting HTTP server on port ${port}...`);

        // Create and start HTTP server
        const httpApp = createHTTPServer();
        httpApp.listen(port, () => {
          console.log(`✅ HTTP server started successfully on port ${port}!`);
          console.log(
            `🌐 HTTP endpoints available at http://localhost:${port}/`
          );
        });
      } else {
        console.log("🔗 Starting MCP server with stdio transport...");
        server.start({
          transportType: "stdio",
        });
        console.log("✅ Dradis MCP server started successfully!");
      }

      console.log(
        "📝 Available MCP tools: setProject, createProject, createVulnerability, getVulnerabilities, updateVulnerability, getContentBlocks, updateContentBlock, getDocumentProperties, upsertDocumentProperty"
      );

      if (runMode === "http") {
        console.log(
          "🌐 Available HTTP endpoints (GET & POST): /getProjectDetails, /getVulnerabilities, /getAllVulnerabilityDetails, /getVulnerability, /getContentBlocks, /getDocumentProperties"
        );
        console.log(
          "🌐 Available HTTP endpoints (POST only): /setProject, /createProject, /createVulnerability, /updateVulnerability, /updateContentBlock, /upsertDocumentProperty"
        );
      }
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
