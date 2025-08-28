# HTTP Endpoints Documentation

This document describes the HTTP REST API endpoints available in the Dradis MCP server, optimized for MCPO (MCP-to-OpenAPI proxy) integration.

## Running with MCPO (Recommended)

[MCPO](https://github.com/open-webui/mcpo) converts MCP servers to OpenAPI-compatible HTTP endpoints with auto-generated documentation. To use your Dradis MCP server with MCPO:

```bash
# Start your Dradis MCP server in stdio mode (default)
npm start

# In another terminal, start MCPO to proxy the MCP server
uvx mcpo --port 8000 --api-key "your-secret-key" -- node dist/server.js
```

Your server will be available at **http://localhost:8000** with auto-generated OpenAPI documentation at **http://localhost:8000/docs**.

## Direct HTTP Mode (Alternative)

You can also run in direct HTTP mode instead of using MCPO:

```bash
# Set environment variable and start
DRADIS_MCP_MODE=http npm start

# Or with custom port
DRADIS_MCP_MODE=http PORT=8080 npm start
```

Default port is 3000 if not specified.

## Base URLs

**With MCPO (Recommended):**

```
http://localhost:8000
```

**Direct HTTP Mode:**

```
http://localhost:3000
```

## Authentication

**With MCPO**: Use `Authorization: Bearer your-secret-key` header
**Direct HTTP Mode**: Requires environment variables:

- `DRADIS_URL` - Your Dradis instance URL
- `DRADIS_API_TOKEN` - Your Dradis API token

## Project Context

Most endpoints require a project to be set first using `/setProject`.

## Available Endpoints

All endpoints now include comprehensive request bodies with detailed parameter descriptions for optimal OpenAPI schema generation.

### Read Operations

#### POST /getProjectDetails

Returns detailed information about the current project including metadata, team, and settings.

**Example:**

```bash
curl -X POST http://localhost:8000/getProjectDetails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "includeMetadata": true
  }'
```

#### POST /getVulnerabilities

Retrieves a paginated list of vulnerability summaries including ID, title, and risk rating.

**Example:**

```bash
curl -X POST http://localhost:8000/getVulnerabilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "page": 1,
    "includeFields": ["Title", "Risk", "Status"]
  }'
```

#### POST /getAllVulnerabilityDetails

Retrieves complete vulnerability details including all fields and metadata.

**Example:**

```bash
curl -X POST http://localhost:8000/getAllVulnerabilityDetails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "page": 1,
    "filterByRisk": "High"
  }'
```

#### POST /getVulnerability

Retrieves complete details for a specific vulnerability including evidence and metadata.

**Example:**

```bash
curl -X POST http://localhost:8000/getVulnerability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "vulnerabilityId": 123,
    "includeEvidence": true
  }'
```

#### POST /getContentBlocks

Retrieves all content blocks with their IDs and field data.

**Example:**

```bash
curl -X POST http://localhost:8000/getContentBlocks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "blockGroup": "evidence",
    "includeContent": true
  }'
```

#### POST /getDocumentProperties

Retrieves all document properties and their values for project configuration.

**Example:**

```bash
curl -X POST http://localhost:8000/getDocumentProperties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "propertyPrefix": "dradis.",
    "includeEmpty": false
  }'
```

### Write Operations

#### POST /setProject

Sets the current project context for all subsequent operations.

```bash
curl -X POST http://localhost:8000/setProject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{"projectId": 123}'
```

#### POST /createProject

Creates a new Dradis project and sets it as current context.

```bash
curl -X POST http://localhost:8000/createProject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "name": "My Project",
    "team_id": 1
  }'
```

#### POST /createVulnerability

Creates a new security vulnerability finding with detailed information.

```bash
curl -X POST http://localhost:8000/createVulnerability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "Title": "SQL Injection",
    "Risk": "High",
    "Description": "SQL injection vulnerability found..."
  }'
```

#### POST /updateVulnerability

Updates an existing vulnerability with new information.

```bash
curl -X POST http://localhost:8000/updateVulnerability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "issueId": 123,
    "parameters": {
      "Risk": "Critical",
      "Status": "Fixed"
    }
  }'
```

#### POST /updateContentBlock

Updates a content block with new field values and content.

```bash
curl -X POST http://localhost:8000/updateContentBlock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "blockId": 456,
    "contentBlock": {
      "block_group": "evidence",
      "content": {
        "field1": "updated value"
      }
    }
  }'
```

#### POST /upsertDocumentProperty

Creates or updates a document property value in the current project.

```bash
curl -X POST http://localhost:8000/upsertDocumentProperty \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "propertyName": "dradis.client",
    "value": "ACME Corporation",
    "overwriteExisting": true
  }'
```

## Error Responses

All endpoints return JSON error responses with appropriate HTTP status codes:

```json
{
  "error": "Error message description"
}
```

Common error codes:

- `400`: Bad Request (invalid parameters, no project set)
- `401`: Unauthorized (invalid API key with MCPO)
- `500`: Internal Server Error (API issues, configuration problems)

## Testing with MCPO

To test the OpenAPI integration:

```bash
# Start Dradis MCP server
npm start

# In another terminal, start MCPO
uvx mcpo --port 8000 --api-key "test-key" -- node dist/server.js

# Access the interactive API documentation
open http://localhost:8000/docs
```

## MCPO Benefits

Using MCPO provides several advantages:

- **Auto-generated OpenAPI Schema**: Complete API documentation with request/response examples
- **Interactive Testing**: Built-in Swagger UI for testing endpoints
- **Authentication**: Secure API key-based authentication
- **Standard HTTP**: Works with any HTTP client or SDK
- **Type Safety**: Generated client SDKs with proper typing

## OpenAPI Schema Features

The generated OpenAPI schema includes:

- Detailed parameter descriptions for all tools
- Request/response schemas with examples
- Proper HTTP status codes and error handling
- Authentication requirements
- Tool categorization (read vs write operations)
- Optional parameter handling with defaults
- Comprehensive field descriptions and validation rules
