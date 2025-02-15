# Dradis MCP

A FastMCP server implementation for interacting with Dradis Pro, a collaborative platform for information security teams. This MCP allows you to manage projects and vulnerabilities in Dradis directly through your MCP-enabled tools.

## Features

- Project Management
  - Create new projects
  - Get project details
  - Set active project for operations
- Vulnerability Management
  - Create vulnerabilities
  - Update existing vulnerabilities
  - Get vulnerability details
  - Get all vulnerability details
  - List vulnerabilities with pagination support
- Content Block Management
  - Get all content blocks in current project
  - Update a content block
- Document Property Management
  - Get all document properties
  - Create or update a document property
- Robust error handling and input validation
- Consistent JSON response formatting

## Prerequisites

- Node.js (v14 or higher)
- npm
- A Dradis Pro instance
- Dradis API token

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DRADIS_URL=<url>
DRADIS_API_TOKEN=<token>
DRADIS_DEFAULT_TEAM_ID=<teamId>
DRADIS_DEFAULT_TEMPLATE_ID=<templateId>
DRADIS_VULNERABILITY_PARAMETERS=<commaSeparatedParams> // Title,Description,Solution,etc. 
```

### MCP Config File

To add Dradis MCP to your MCP configuration, add the following to your config file to mcp.json if you're using 5ire:

```json
{
  "servers": [
    {
      "key": "Dradis",
      "command": "npx",
      "description": "A Model Context Protocol server that provides integration with Dradis note-taking platform",
      "args": ["-y", "dradis-mcp"],
      "env": {
        "DRADIS_URL": "<url:string:Your Dradis instance URL>",
        "DRADIS_API_TOKEN": "<token:string:Your Dradis API token>",
        "DRADIS_DEFAULT_TEAM_ID": "<number:string:Default team ID for project creation>",
        "DRADIS_DEFAULT_TEMPLATE_ID": "<number:string:Default template ID for project creation>"
      },
      "isActive": false
    }
  ]
}
```

## Available Tools

### Project Management

- `setProject`: Set the current Dradis project
  ```typescript
  { projectId: number }
  ```

- `getProjectDetails`: Get details of the current project
  ```typescript
  // No parameters required
  ```

- `createProject`: Create a new Dradis project
  ```typescript
  {
    name: string;
    team_id?: number;  // Optional if DRADIS_DEFAULT_TEAM_ID is set
    report_template_properties_id?: number;  // Optional if DRADIS_DEFAULT_TEMPLATE_ID is set
    author_ids?: number[];
    template?: string;  // Optional if DRADIS_DEFAULT_TEMPLATE is set
  }
  ```

### Vulnerability Management

- `createVulnerability`: Create a new vulnerability
  ```typescript
  {
    text: string; // Content with #[ ]# field syntax
  }
  ```

- `getVulnerabilities`: List vulnerabilities (25 per page)
  ```typescript
  {
    page?: number; // Optional page number
  }
  ```

- `getVulnerability`: Get specific vulnerability
  ```typescript
  {
    vulnerabilityId: number;
  }
  ```

- `updateVulnerability`: Update existing vulnerability
  ```typescript
  {
    issueId: number;
    parameters: {
      text: string;
    }
  }
  ```

### Content Block Management

- `getContentBlocks`: Get all content blocks in current project
  ```typescript
  // No parameters required
  ```

- `updateContentBlock`: Update a content block
  ```typescript
  {
    blockId: number;
    contentBlock: {
      content: string;
    }
  }
  ```

### Document Property Management

- `getDocumentProperties`: Get all document properties
  ```typescript
  // No parameters required
  ```

- `upsertDocumentProperty`: Create or update a document property
  ```typescript
  {
    propertyName: string;
    value: string;
  }
  ```

## Development

To run the server in development mode with the CLI:

```bash
npm run dev
```

To inspect the server using MCP Inspector:

```bash
npm run inspect
```

## Building

To build the TypeScript code:

```bash
npm run build
```

## Running in Production

To run the built server:

```bash
npm start
```

## Project Structure

- `/src` - Source code
  - `api.ts` - Dradis API client implementation
  - `config.ts` - Configuration loading and validation
  - `server.ts` - MCP server implementation
  - `types.ts` - TypeScript type definitions
- `/dist` - Compiled JavaScript (generated after build)

## Error Handling

The MCP provides detailed error messages for:
- Missing or invalid configuration
- API request failures
- Invalid input parameters
- Missing project ID
- Network errors

## Response Format

All tool responses are formatted as JSON with consistent structure:
- Success responses include relevant data and optional success messages
- Error responses include detailed error messages and context
- List endpoints include pagination metadata when applicable
