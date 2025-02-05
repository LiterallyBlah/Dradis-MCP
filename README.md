# Dradis Pro MCP Server

A production-ready MCP server for managing vulnerability issues in Dradis Pro using TypeScript.

## 🚀 Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

## ✨ Key Features

- Comprehensive vulnerability issue management
  - Create new vulnerability issues
  - Update existing vulnerability findings
  - Delete obsolete vulnerabilities
  - Search and replace capabilities for scanner-specific content (Nessus, etc.)
- Built with Bun for fast testing and development
- Biome for linting and formatting
- Automated version management
- Clean, maintainable project structure

## 📂 Project Structure

```
dradis-mcp/
├── src/
│   ├── tools/          # Vulnerability management tools
│   ├── utils/          # Shared utilities
│   ├── main.ts         # Server entry point
│   └── types.ts        # Type definitions
├── tests/              # Test files
├── biome.json          # Linting configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## 🛠️ Development

- **Run tests**: `bun test`
- **Format code**: `bun run format`
- **Lint code**: `bun run lint`
- **Build project**: `bun run build`

To add your Dradis Pro MCP server to Claude Desktop:

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
