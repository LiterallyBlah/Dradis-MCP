"""Configuration loading and validation for Dradis MCP server."""

import os
from typing import Optional, List

from pydantic import Field, field_validator, AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class DradisConfig(BaseSettings):
    """Configuration for Dradis MCP server."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Required settings
    dradis_url: AnyHttpUrl = Field(..., description="Dradis Pro instance URL")
    dradis_api_token: str = Field(..., min_length=1, description="Dradis API token")
    
    # Optional settings with defaults
    dradis_default_team_id: Optional[int] = Field(None, description="Default team ID for project creation")
    dradis_default_template_id: Optional[int] = Field(None, description="Default template ID for project creation")
    dradis_default_template: Optional[str] = Field(None, description="Default template name")
    dradis_vulnerability_parameters: List[str] = Field(
        default_factory=list, 
        description="Comma-separated list of vulnerability parameters"
    )
    
    @field_validator("dradis_vulnerability_parameters", mode="before")
    @classmethod
    def parse_vulnerability_parameters(cls, v: str | List[str]) -> List[str]:
        """Parse comma-separated vulnerability parameters."""
        if isinstance(v, str):
            return [param.strip() for param in v.split(",") if param.strip()]
        return v or []
    
    @field_validator("dradis_url", mode="before")
    @classmethod
    def ensure_trailing_slash_removed(cls, v: str) -> str:
        """Remove trailing slash from URL."""
        return v.rstrip("/")


def load_config() -> DradisConfig:
    """Load and validate configuration from environment variables."""
    try:
        return DradisConfig()
    except Exception as e:
        missing_vars = []
        
        # Check for required environment variables
        if not os.getenv("DRADIS_URL"):
            missing_vars.append("DRADIS_URL")
        if not os.getenv("DRADIS_API_TOKEN"):
            missing_vars.append("DRADIS_API_TOKEN")
            
        if missing_vars:
            error_msg = (
                f"Missing required environment variables: {', '.join(missing_vars)}\n\n"
                "Please set the following environment variables:\n"
                "- DRADIS_URL: Your Dradis Pro instance URL\n"
                "- DRADIS_API_TOKEN: Your Dradis API token\n\n"
                "Optional variables:\n"
                "- DRADIS_DEFAULT_TEAM_ID: Default team ID for project creation\n"
                "- DRADIS_DEFAULT_TEMPLATE_ID: Default template ID for project creation\n"
                "- DRADIS_DEFAULT_TEMPLATE: Default template name\n"
                "- DRADIS_VULNERABILITY_PARAMETERS: Comma-separated vulnerability parameters\n\n"
                "Create a .env file with these variables or set them in your environment."
            )
            raise ValueError(error_msg) from e
        
        raise
