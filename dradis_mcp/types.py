"""Type definitions for Dradis MCP server."""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# Base schemas
class DradisFieldsBase(BaseModel):
    """Base class for Dradis field schemas."""
    pass


# Project related types
class Client(BaseModel):
    """Dradis client information."""
    id: int
    name: str


class User(BaseModel):
    """Dradis user information."""
    email: str


class CustomField(BaseModel):
    """Dradis custom field."""
    id: int
    name: str
    value: str


class ProjectCreationState(BaseModel):
    """Project creation state."""
    state: str  # 'being_created' or 'completed'


class ProjectDetails(BaseModel):
    """Detailed project information."""
    id: int
    name: str
    client: Client
    project_creation: Optional[ProjectCreationState] = None
    created_at: str
    updated_at: str
    authors: List[User]
    owners: List[User]
    custom_fields: Optional[List[CustomField]] = None


class CreateProject(BaseModel):
    """Schema for creating a new project."""
    name: str
    team_id: int
    report_template_properties_id: Optional[int] = None
    author_ids: Optional[List[int]] = None
    template: Optional[str] = None


# Vulnerability related types
class VulnerabilityFields(DradisFieldsBase):
    """Dynamic vulnerability fields based on configuration."""
    # Fields will be dynamically added based on DRADIS_VULNERABILITY_PARAMETERS
    pass


class Vulnerability(BaseModel):
    """Dradis vulnerability."""
    id: int
    author: str
    title: str
    fields: Dict[str, Any]
    text: str
    created_at: str
    updated_at: str


class VulnerabilityListItem(BaseModel):
    """Simplified vulnerability for listing."""
    id: int
    title: str
    fields: Dict[str, str]


class UpdateVulnerabilityRequest(BaseModel):
    """Schema for updating vulnerability."""
    # Fields will be dynamically added based on configuration
    pass


# Content Block related types
class ContentBlock(BaseModel):
    """Dradis content block."""
    id: int
    author: str
    block_group: str
    title: str
    fields: Dict[str, str]
    content: str


class UpdateContentBlock(BaseModel):
    """Schema for updating content block."""
    block_group: str
    content: Dict[str, str] = Field(..., min_length=1)


# Document Property types
class DocumentProperty(BaseModel):
    """Document property."""
    pass  # This will be a dict-like structure


# Server state
class ServerState(BaseModel):
    """Current server state."""
    project_id: Optional[int] = None
    api_token: Optional[str] = None
    dradis_url: Optional[str] = None


def create_vulnerability_schema(parameters: List[str]) -> type[BaseModel]:
    """Create a dynamic vulnerability schema based on parameters."""
    if not parameters:
        # Return base schema with minimal fields
        class MinimalVulnerabilitySchema(BaseModel):
            Title: str = Field(..., description="Vulnerability title")
            Description: str = Field(..., description="Vulnerability description")
        return MinimalVulnerabilitySchema
    
    # Create dynamic fields
    fields = {}
    for param in parameters:
        fields[param] = Field(..., description=f"{param} field")
    
    # Create dynamic model
    return type("CreateVulnerabilityRequest", (BaseModel,), {
        "__annotations__": {name: str for name in fields.keys()},
        **fields
    })


def create_update_vulnerability_schema(parameters: List[str]) -> type[BaseModel]:
    """Create a dynamic update vulnerability schema based on parameters."""
    if not parameters:
        # Return base schema with minimal fields
        class MinimalUpdateVulnerabilitySchema(BaseModel):
            Title: Optional[str] = Field(None, description="Vulnerability title")
            Description: Optional[str] = Field(None, description="Vulnerability description")
        return MinimalUpdateVulnerabilitySchema
    
    # Create dynamic fields (all optional for updates)
    fields = {}
    for param in parameters:
        fields[param] = Field(None, description=f"{param} field")
    
    # Create dynamic model
    return type("UpdateVulnerabilityRequest", (BaseModel,), {
        "__annotations__": {name: Optional[str] for name in fields.keys()},
        **fields
    })
