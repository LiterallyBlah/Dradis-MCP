# Get the details of the current Dradis project
This MCP tool allows you to get the details of the current Dradis project. It utilises the set project ID stored in the MCP server and uses it to make the request to Dradis.

## MCP Server Request Syntax

The MCP server accepts requests in the following format:
```json
{
    "action": "getProjectDetails",
    "data": {}
}
```

# Dradis API Call
# The Dradis API call to `GET /pro/api/projects/:id` to retrieve project details.
# The `id` parameter is the ID of the project you want to retrieve details for.
# The `Authorisation` header is used to pass your Dradis API token.
# The response will be a JSON object containing the project details.
# For more information, see https://dradisframework.com/pro/api-docs/#get-pro-api-projects-id
# Dradis API Call
The Dradis API call to `GET /pro/api/projects/:id` to retrieve project details. Here is an example request:
```bash
curl -X GET "https://dradis.example.com/pro/api/projects/:id" \
     -H "Authorisation: Token token=YOUR_API_TOKEN"