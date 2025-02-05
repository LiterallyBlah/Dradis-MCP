# Create a new Dradis project
Create a new Dradis project, which then can be used with the MCP server for managing vulnerability issues. This tool will automatically set the current Dradis project as the current project in the MCP server.

## MCP Server Request Syntax

The MCP server accepts requests in the following format:
```json
{
    "action": "createProject",
    "data": {
        "project": {
            "name": "string",
            "team_id": "number",
            "report_template_properties_id": "number (optional)",
            "author_ids": ["number (optional)"],
            "template": "string (optional)"
        }
    }
}
```

## Dradis API Call
The Dradis API call to create a new project is a POST request to the `/pro/api/projects` endpoint. Here's an example of how to make this request using `curl`:

```bash
curl -X POST \
  -H 'Authorization: Token token="YOUR_API_TOKEN"' \
  -H 'Content-Type: application/json' \
  -d '{
    "project": {
      "name": "New Project Name",
      "team_id": 1,
      "report_template_properties_id": 4,
      "author_ids": [4, 5],
      "template": "Welcome Project Template"
    }
  }'
```
