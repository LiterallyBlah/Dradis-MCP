# HTTP Endpoints Documentation

This document describes the HTTP REST API endpoints available in the Dradis MCP server.

## Running in HTTP Mode

To start the server in HTTP mode instead of stdio mode:

```bash
# Set environment variable and start
DRADIS_MCP_MODE=http npm start

# Or with custom port
DRADIS_MCP_MODE=http PORT=8080 npm start
```

Default port is 3000 if not specified.

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints require that the Dradis API be properly configured with:

- `DRADIS_URL` environment variable
- `DRADIS_API_TOKEN` environment variable

## Project Context

Most endpoints require a project to be set first using `/setProject`.

## Available Endpoints

### GET and POST Methods

These endpoints support both GET and POST methods:

#### GET/POST /getProjectDetails

Returns details of the currently set project.

**GET Example:**

```bash
curl http://localhost:3000/getProjectDetails
```

**POST Example:**

```bash
curl -X POST http://localhost:3000/getProjectDetails \
  -H "Content-Type: application/json"
```

#### GET/POST /getVulnerabilities

Lists vulnerabilities in the current project (25 items per page).

**GET Example:**

```bash
curl "http://localhost:3000/getVulnerabilities?page=1"
```

**POST Example:**

```bash
curl -X POST http://localhost:3000/getVulnerabilities \
  -H "Content-Type: application/json" \
  -d '{"page": 1}'
```

#### GET/POST /getAllVulnerabilityDetails

Gets detailed vulnerability information (25 items per page).

**GET Example:**

```bash
curl "http://localhost:3000/getAllVulnerabilityDetails?page=1"
```

**POST Example:**

```bash
curl -X POST http://localhost:3000/getAllVulnerabilityDetails \
  -H "Content-Type: application/json" \
  -d '{"page": 1}'
```

#### GET/POST /getVulnerability

Gets a specific vulnerability by ID.

**GET Example:**

```bash
curl "http://localhost:3000/getVulnerability?vulnerabilityId=123"
```

**POST Example:**

```bash
curl -X POST http://localhost:3000/getVulnerability \
  -H "Content-Type: application/json" \
  -d '{"vulnerabilityId": 123}'
```

#### GET/POST /getContentBlocks

Lists all content blocks in the current project.

**GET Example:**

```bash
curl http://localhost:3000/getContentBlocks
```

**POST Example:**

```bash
curl -X POST http://localhost:3000/getContentBlocks \
  -H "Content-Type: application/json"
```

#### GET/POST /getDocumentProperties

Lists all document properties for the current project.

**GET Example:**

```bash
curl http://localhost:3000/getDocumentProperties
```

**POST Example:**

```bash
curl -X POST http://localhost:3000/getDocumentProperties \
  -H "Content-Type: application/json"
```

### POST Only Methods

These endpoints only support POST method:

#### POST /setProject

Sets the current project context.

```bash
curl -X POST http://localhost:3000/setProject \
  -H "Content-Type: application/json" \
  -d '{"projectId": 123}'
```

#### POST /createProject

Creates a new Dradis project.

```bash
curl -X POST http://localhost:3000/createProject \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "team_id": 1
  }'
```

#### POST /createVulnerability

Creates a new vulnerability in the current project.

```bash
curl -X POST http://localhost:3000/createVulnerability \
  -H "Content-Type: application/json" \
  -d '{
    "Title": "SQL Injection",
    "Risk": "High",
    "Description": "SQL injection vulnerability found..."
  }'
```

#### POST /updateVulnerability

Updates an existing vulnerability.

```bash
curl -X POST http://localhost:3000/updateVulnerability \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": 123,
    "parameters": {
      "Risk": "Critical",
      "Status": "Fixed"
    }
  }'
```

#### POST /updateContentBlock

Updates a content block.

```bash
curl -X POST http://localhost:3000/updateContentBlock \
  -H "Content-Type: application/json" \
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

Creates or updates a document property.

```bash
curl -X POST http://localhost:3000/upsertDocumentProperty \
  -H "Content-Type: application/json" \
  -d '{
    "propertyName": "dradis.client",
    "value": "ACME Corporation"
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
- `500`: Internal Server Error (API issues, configuration problems)

## Testing

Use the provided test script to verify endpoints:

```bash
# Start server in HTTP mode
DRADIS_MCP_MODE=http npm start

# In another terminal, run tests
node test-http-endpoints.js
```

## CORS

CORS is enabled by default, allowing cross-origin requests from web applications.
