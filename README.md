# Dradis MCP Server (Python)

A FastMCP server implementation for interacting with Dradis Pro, a collaborative platform for information security teams. This MCP allows you to manage projects and vulnerabilities in Dradis directly through your MCP-enabled tools.

## Features

- **Project Management**
  - Create new projects
  - Get project details
  - Set active project for operations
- **Vulnerability Management**
  - Create vulnerabilities
  - Update existing vulnerabilities
  - Get vulnerability details
  - Get all vulnerability details
  - List vulnerabilities with pagination support
- **Content Block Management**
  - Get all content blocks in current project
  - Update a content block
- **Document Property Management**
  - Get all document properties
  - Create or update a document property
- **Robust error handling and input validation**
- **Consistent JSON response formatting**

## Prerequisites

- Python 3.10 or higher
- A Dradis Pro instance
- Dradis API token

## Installation

### Using pip

```bash
pip install dradis-mcp
```

### From source

```bash
git clone https://github.com/LiterallyBlah/Dradis-MCP.git
cd Dradis-MCP
pip install -e .
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DRADIS_URL=https://your-dradis-instance.com
DRADIS_API_TOKEN=your_api_token_here
DRADIS_DEFAULT_TEAM_ID=1
DRADIS_DEFAULT_TEMPLATE_ID=1
DRADIS_VULNERABILITY_PARAMETERS=Title,Description,Solution,Impact,CVSS,References
```

### Required Variables

- `DRADIS_URL`: Your Dradis Pro instance URL
- `DRADIS_API_TOKEN`: Your Dradis API token

### Optional Variables

- `DRADIS_DEFAULT_TEAM_ID`: Default team ID for project creation
- `DRADIS_DEFAULT_TEMPLATE_ID`: Default template ID for project creation
- `DRADIS_DEFAULT_TEMPLATE`: Default template name
- `DRADIS_VULNERABILITY_PARAMETERS`: Comma-separated list of vulnerability field parameters

### MCP Configuration

To add Dradis MCP to your MCP configuration, add the following to your MCP config file:

```json
{
  "servers": [
    {
      "key": "dradis",
      "command": "dradis-mcp",
      "description": "A Model Context Protocol server that provides integration with Dradis note-taking platform",
      "env": {
        "DRADIS_URL": "https://your-dradis-instance.com",
        "DRADIS_API_TOKEN": "your_api_token_here",
        "DRADIS_DEFAULT_TEAM_ID": "1",
        "DRADIS_DEFAULT_TEMPLATE_ID": "1",
        "DRADIS_VULNERABILITY_PARAMETERS": "Title,Description,Solution,Impact,CVSS,References"
      },
      "isActive": true
    }
  ]
}
```

## Available Tools

### Project Management

- **`set_project`**: Set the current Dradis project

  - Parameters: `project_id: int`

- **`get_project_details`**: Get details of the current project

  - No parameters required

- **`create_project`**: Create a new Dradis project
  - Parameters:
    - `name: str` - Project name
    - `team_id: int` (optional if DRADIS_DEFAULT_TEAM_ID is set)
    - `report_template_properties_id: int` (optional if DRADIS_DEFAULT_TEMPLATE_ID is set)
    - `author_ids: List[int]` (optional)
    - `template: str` (optional if DRADIS_DEFAULT_TEMPLATE is set)

### Vulnerability Management

- **`create_vulnerability`**: Create a new vulnerability

  - Dynamic parameters based on `DRADIS_VULNERABILITY_PARAMETERS`
  - Example: `Title`, `Description`, `Solution`, etc.

- **`get_vulnerabilities`**: List vulnerabilities (25 per page)

  - Parameters: `page: int` (optional)

- **`get_all_vulnerability_details`**: Get detailed vulnerability list

  - Parameters: `page: int` (optional)

- **`get_vulnerability`**: Get specific vulnerability

  - Parameters: `vulnerability_id: int`

- **`update_vulnerability`**: Update existing vulnerability
  - Parameters:
    - `issue_id: int`
    - Dynamic fields based on `DRADIS_VULNERABILITY_PARAMETERS`

### Content Block Management

- **`get_content_blocks`**: Get all content blocks in current project

  - No parameters required

- **`update_content_block`**: Update a content block
  - Parameters:
    - `block_id: int`
    - `block_group: str`
    - `content: Dict[str, str]`

### Document Property Management

- **`get_document_properties`**: Get all document properties

  - No parameters required

- **`upsert_document_property`**: Create or update a document property
  - Parameters:
    - `property_name: str`
    - `value: str`

## Development

### Running in Development Mode

To run the server in development mode:

```bash
# Using the MCP development tools
uv run mcp dev src/dradis_mcp/server.py

# Or directly with Python
python -m dradis_mcp.server
```

### Testing with MCP Inspector

```bash
uv run mcp dev src/dradis_mcp/server.py
```

### Building

To build the package:

```bash
pip install build
python -m build
```

## Project Structure

```
src/dradis_mcp/
├── __init__.py          # Package initialization
├── server.py            # Main MCP server implementation
├── api.py              # Dradis API client
├── config.py           # Configuration management
└── types.py            # Type definitions and schemas
```

## Migration from TypeScript Version

This Python version maintains full compatibility with the original TypeScript implementation:

- All tools have the same names and signatures
- Response formats are identical
- Configuration environment variables are the same
- Error handling behavior is preserved

### Key Differences

- Uses Python's `asyncio` instead of Node.js async/await
- Uses `httpx` instead of `fetch` for HTTP requests
- Uses `pydantic` for data validation instead of `zod`
- Uses Python's `ssl` module for certificate handling

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

## SSL/TLS Considerations

The server disables SSL verification for self-signed certificates by default (matching the original TypeScript behavior). For production use, ensure your Dradis instance has a valid SSL certificate or modify the SSL settings in the configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/LiterallyBlah/Dradis-MCP/issues) page.
