# Set the current Dradis project
Setting the current Dradis project allows you to use the MCP server for managing vulnerability issues in the project.

## MCP Server Request Syntax

The MCP server accepts requests in the following format:
```json
{
    "action": "setProject",
    "data": {
        "project": "dradis-project-id"
    }
}
```