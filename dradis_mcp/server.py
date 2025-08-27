#!/usr/bin/env python3
"""
Dradis MCP Server

A FastMCP server implementation for interacting with Dradis Pro.
This server provides tools for managing projects, vulnerabilities, content blocks,
and document properties in Dradis.
"""

import asyncio
import json
import logging
import ssl
import sys
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from mcp.server.fastmcp import Context, FastMCP
from mcp.server.session import ServerSession

from .api import DradisAPI
from .config import DradisConfig, load_config
from .types import (
    CreateProject, 
    UpdateContentBlock,
    create_vulnerability_schema,
    create_update_vulnerability_schema,
)

# Load environment variables
load_dotenv()

# Disable SSL warnings for self-signed certificates
ssl._create_default_https_context = ssl._create_unverified_context

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
server_state = {
    "project_id": None,
    "config": None,
    "api": None,
}


def format_response(data: Any) -> str:
    """Format response data as JSON."""
    return json.dumps(data, indent=2, default=str)


@asynccontextmanager
async def app_lifespan(app: FastMCP):
    """Manage application lifecycle."""
    try:
        # Load configuration
        config = load_config()
        server_state["config"] = config
        
        # Initialize API client
        api = DradisAPI(config)
        server_state["api"] = api
        
        logger.info("Dradis MCP server initialized successfully")
        
        yield {"config": config, "api": api}
        
    except Exception as e:
        logger.error(f"Failed to initialize server: {e}")
        raise
    finally:
        # Cleanup
        if server_state["api"]:
            await server_state["api"].close()


# Create FastMCP server
mcp = FastMCP(
    "Dradis MCP",
    version="2.1.0",
    lifespan=app_lifespan
)


# Helper function to get API client
def get_api() -> DradisAPI:
    """Get the API client from server state."""
    api = server_state.get("api")
    if not api:
        raise ValueError("API not initialized. Check your configuration.")
    return api


def get_config() -> DradisConfig:
    """Get the configuration from server state."""
    config = server_state.get("config")
    if not config:
        raise ValueError("Configuration not loaded.")
    return config


# Project Management Tools

@mcp.tool()
async def set_project(project_id: int) -> str:
    """Set the current Dradis project.
    
    Args:
        project_id: The ID of the project to set as current
        
    Returns:
        Confirmation message
    """
    api = get_api()
    
    # Verify project exists before setting
    await api.get_project_details(project_id)
    server_state["project_id"] = project_id
    
    return format_response({"message": f"Project ID set to {project_id}"})


@mcp.tool()
async def get_project_details() -> str:
    """Get details of the current Dradis project.
    
    Returns:
        Project details as JSON
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    details = await api.get_project_details(project_id)
    
    return format_response(details.model_dump())


@mcp.tool()
async def create_project(
    name: str,
    team_id: Optional[int] = None,
    report_template_properties_id: Optional[int] = None,
    author_ids: Optional[List[int]] = None,
    template: Optional[str] = None
) -> str:
    """Create a new Dradis project.
    
    Args:
        name: Name of the project
        team_id: Team ID (optional if DRADIS_DEFAULT_TEAM_ID is set)
        report_template_properties_id: Template ID (optional if DRADIS_DEFAULT_TEMPLATE_ID is set)
        author_ids: List of author IDs
        template: Template name (optional if DRADIS_DEFAULT_TEMPLATE is set)
        
    Returns:
        Project creation result as JSON
    """
    api = get_api()
    config = get_config()
    
    # Apply defaults from configuration
    if team_id is None and config.dradis_default_team_id:
        team_id = config.dradis_default_team_id
        
    if report_template_properties_id is None and config.dradis_default_template_id:
        report_template_properties_id = config.dradis_default_template_id
        
    if template is None and config.dradis_default_template:
        template = config.dradis_default_template
    
    if team_id is None:
        raise ValueError("team_id is required and DRADIS_DEFAULT_TEAM_ID is not set")
    
    project_data = CreateProject(
        name=name,
        team_id=team_id,
        report_template_properties_id=report_template_properties_id,
        author_ids=author_ids,
        template=template
    )
    
    project = await api.create_project(project_data)
    server_state["project_id"] = project.id  # Automatically set as current project
    
    return format_response({
        "message": f"Project created successfully with ID {project.id}",
        "project": project.model_dump()
    })


# Vulnerability Management Tools

@mcp.tool()
async def create_vulnerability(**kwargs) -> str:
    """Create a new vulnerability in the current project.
    
    This tool accepts dynamic arguments based on DRADIS_VULNERABILITY_PARAMETERS.
    
    Returns:
        Vulnerability creation result as JSON
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    
    # Convert kwargs to vulnerability data
    vulnerability_data = {k: str(v) for k, v in kwargs.items() if v is not None}
    
    result = await api.create_vulnerability(project_id, vulnerability_data)
    
    return format_response({
        "message": "Vulnerability created successfully",
        "vulnerability": result.model_dump()
    })


@mcp.tool()
async def get_vulnerabilities(page: Optional[int] = None) -> str:
    """Get list of vulnerabilities in the current project.
    
    Args:
        page: Page number for pagination (optional)
        
    Returns:
        List of vulnerabilities with summary format
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    vulnerabilities = await api.get_vulnerabilities(project_id, page)
    
    result = {
        "page": page or 1,
        "items_per_page": 25,
        "vulnerabilities": [vuln.model_dump() for vuln in vulnerabilities]
    }
    
    return f"{format_response(result)}\n\nGenerate the results as a list of '<ID>: <Rating> - <title>'"


@mcp.tool()
async def get_all_vulnerability_details(page: Optional[int] = None) -> str:
    """Get list of all vulnerability details in the current project.
    
    Args:
        page: Page number for pagination (optional)
        
    Returns:
        Detailed list of vulnerabilities
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    vulnerabilities = await api.get_all_vulnerability_details(project_id, page)
    
    result = {
        "page": page or 1,
        "items_per_page": 25,
        "vulnerabilities": [vuln.model_dump() for vuln in vulnerabilities]
    }
    
    return f"{format_response(result)}\n\nGenerate the results as a list of '<ID>: <Rating> - <title>'"


@mcp.tool()
async def get_vulnerability(vulnerability_id: int) -> str:
    """Get a specific vulnerability from the current project.
    
    Args:
        vulnerability_id: ID of the vulnerability to retrieve
        
    Returns:
        Vulnerability details as JSON
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    vulnerability = await api.get_vulnerability(project_id, vulnerability_id)
    
    return format_response(vulnerability)


@mcp.tool()
async def update_vulnerability(issue_id: int, **kwargs) -> str:
    """Update an existing vulnerability.
    
    Args:
        issue_id: ID of the vulnerability to update
        **kwargs: Fields to update (based on DRADIS_VULNERABILITY_PARAMETERS)
        
    Returns:
        Update result as JSON
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    
    # Filter out None values and convert to strings
    update_data = {k: str(v) for k, v in kwargs.items() if v is not None}
    
    result = await api.update_vulnerability(project_id, issue_id, update_data)
    
    return format_response({
        "message": "Vulnerability updated successfully",
        "vulnerability": result.model_dump()
    })


# Content Block Management Tools

@mcp.tool()
async def get_content_blocks() -> str:
    """Get all content blocks in the current project.
    
    Returns:
        List of content blocks as JSON
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    content_blocks = await api.get_content_blocks(project_id)
    
    return f"Output the content blocks in a list, with the ID followed by the fields (even empty fields with no values): {format_response(content_blocks)}"


@mcp.tool()
async def update_content_block(
    block_id: int,
    block_group: str,
    content: Dict[str, str]
) -> str:
    """Update a content block in the current project.
    
    Args:
        block_id: ID of the content block to update
        block_group: Block group name
        content: Dictionary of field names and values to update
        
    Returns:
        Updated content block as JSON
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    
    content_block_update = UpdateContentBlock(
        block_group=block_group,
        content=content
    )
    
    block = await api.update_content_block(project_id, block_id, content_block_update)
    
    return format_response(block.model_dump())


# Document Property Management Tools

@mcp.tool()
async def get_document_properties() -> str:
    """Get all document properties for the current project.
    
    Returns:
        List of document properties
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    properties = await api.get_document_properties(project_id)
    
    return f"List the following properties with <name>: <value>. Don't change any details of the names and values: \n{format_response(properties)}"


@mcp.tool()
async def upsert_document_property(property_name: str, value: str) -> str:
    """Create or update a document property in the current project.
    
    Args:
        property_name: Name of the property
        value: Value to set
        
    Returns:
        Updated property as JSON
    """
    project_id = server_state.get("project_id")
    if not project_id:
        raise ValueError("No project ID set. Use set_project or create_project first.")
    
    api = get_api()
    property_result = await api.upsert_document_property(project_id, property_name, value)
    
    return format_response(property_result)


async def test_connection() -> bool:
    """Test API connection."""
    try:
        logger.info("Testing API connection...")
        api = get_api()
        await api.get_project_details(1)
        logger.info("API connection successful!")
        return True
    except Exception as e:
        logger.error(f"API connection failed: {e}")
        return False


def main() -> None:
    """Main entry point for the server."""
    try:
        # Run the server
        mcp.run()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
