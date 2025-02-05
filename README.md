# Dradis Pro MCP Server

A production-ready MCP (Message Communication Protocol) server for managing vulnerability issues in Dradis Pro using TypeScript. This server acts as a bridge between your tools and Dradis Pro, providing a standardised interface for vulnerability management.

## 🚀 Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Configure your Dradis API token in your environment
4. Build the project:
   ```bash
   bun run build
   ```

## ✨ Key Features

- **Project Management**
  - Create new Dradis projects
  - Set active project context
  - Retrieve project details
- **Comprehensive Vulnerability Management**
  - Create new vulnerability issues with structured data
  - Update existing vulnerability findings
  - Retrieve vulnerability lists and details
  - Search and filter capabilities
- **Built with Modern Tools**
  - Bun for fast testing and development
  - TypeScript for type safety
  - Biome for linting and formatting

## 📂 Project Structure

```
dradis-mcp/
├── src/
│   ├── api/           # API endpoint handlers
│   ├── tools/         # Vulnerability management tools
│   ├── utils/         # Shared utilities
│   ├── main.ts        # Server entry point
│   └── types.ts       # Type definitions
├── docs/             # API documentation
├── tests/            # Test files
├── biome.json        # Linting configuration
├── tsconfig.json     # TypeScript configuration
└── package.json      # Project dependencies
```

## 🔌 API Endpoints

The MCP server accepts JSON requests with the following structure:
```json
{
    "action": "<actionName>",
    "data": {
        // Action-specific payload
    }
}
```

### Available Actions:
- `createProject`: Create a new Dradis project
- `createVulnerability`: Create a new vulnerability issue
- `getVulnerability`: Retrieve vulnerability details
- `updateVulnerability`: Update existing vulnerability
- `getProjectDetails`: Get current project information
- `getVulnerabilityList`: Retrieve list of vulnerabilities

For detailed API documentation, see the `/docs` directory.

## 🛠️ Development

- **Run tests**: `bun test`
- **Format code**: `bun run format`
- **Lint code**: `bun run lint`
- **Build project**: `bun run build`

### Integration with Claude Desktop

1. Build the project:
   ```bash
   bun run build
   ```
2. Add to your Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "dradis-pro": {
         "command": "node",
         "args": ["/path/to/your/project/dist/main.js"]
       }
     }
   }
   ```

## 📜 Version Management

This project uses [standard-version](https://github.com/conventional-changelog/standard-version) for automated version management. Run `bun run release` to create a new version.

### Commit Message Format
- `feat`: New feature (bumps minor version)
- `fix`: Bug fix (bumps patch version)
- `BREAKING CHANGE`: Breaking change (bumps major version)

## 📦 Publishing

1. Ensure you're logged in to npm:
   ```bash
   npm login
   ```
2. Build the project:
   ```bash
   bun run build
   ```
3. Publish the package:
   ```bash
   npm publish
   ```

Remember to update the version number using `bun run release` before publishing new versions.
