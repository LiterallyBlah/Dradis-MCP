"""Dradis API client implementation."""

import json
import ssl
from typing import Any, Dict, List, Optional, Union

import httpx
from pydantic import ValidationError

from .config import DradisConfig
from .types import (
    Vulnerability,
    VulnerabilityListItem,
    ProjectDetails,
    CreateProject,
    ContentBlock,
    UpdateContentBlock,
    DocumentProperty,
    UpdateVulnerabilityRequest,
)


class DradisAPI:
    """API client for interacting with Dradis Pro."""
    
    def __init__(self, config: DradisConfig) -> None:
        """Initialize the Dradis API client."""
        self.api_token = config.dradis_api_token
        self.base_url = str(config.dradis_url)
        
        # Create HTTP client with SSL verification disabled (like the original)
        self._client = httpx.AsyncClient(
            headers={
                "Authorization": f"Token token={self.api_token}",
                "Content-Type": "application/json",
            },
            verify=False,  # Disable SSL verification for self-signed certificates
            timeout=30.0,
        )
    
    async def __aenter__(self) -> "DradisAPI":
        """Async context manager entry."""
        await self._client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self._client.__aexit__(exc_type, exc_val, exc_tb)
    
    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
    
    async def _request(
        self, 
        method: str, 
        endpoint: str, 
        project_id: Optional[int] = None,
        **kwargs: Any
    ) -> Any:
        """Make an HTTP request to the Dradis API."""
        url = f"{self.base_url}{endpoint}"
        
        # Add project ID header if provided
        headers = {}
        if project_id is not None:
            headers["Dradis-Project-Id"] = str(project_id)
        
        try:
            response = await self._client.request(
                method=method,
                url=url,
                headers=headers,
                **kwargs
            )
            
            # Try to get response body for error reporting
            try:
                error_body = response.json()
            except:
                error_body = response.text
            
            if not response.is_success:
                raise httpx.HTTPStatusError(
                    f"HTTP {response.status_code} {response.reason_phrase} for {url}\n"
                    f"Response: {error_body}",
                    request=response.request,
                    response=response
                )
            
            return response.json()
            
        except httpx.HTTPStatusError:
            raise
        except Exception as e:
            raise Exception(f"Network error while accessing {url}: {str(e)}") from e
    
    def _construct_dradis_response(self, data: Dict[str, Any]) -> str:
        """Construct Dradis-formatted field text."""
        construction = ""
        for key, value in data.items():
            construction += f"#[{key}]#\r\n{value}\r\n\r\n"
        return construction
    
    async def get_project_details(self, project_id: int) -> ProjectDetails:
        """Get details of a specific project."""
        response = await self._request("GET", f"/pro/api/projects/{project_id}")
        return ProjectDetails(**response)
    
    async def create_project(self, project: CreateProject) -> ProjectDetails:
        """Create a new project."""
        response = await self._request(
            "POST", 
            "/pro/api/projects", 
            json={"project": project.model_dump()}
        )
        return ProjectDetails(**response)
    
    async def get_vulnerabilities(
        self, 
        project_id: int, 
        page: Optional[int] = None
    ) -> List[VulnerabilityListItem]:
        """Get list of vulnerabilities in a project."""
        endpoint = "/pro/api/issues"
        if page:
            endpoint += f"?page={page}"
        
        response = await self._request("GET", endpoint, project_id=project_id)
        
        # Convert to simplified list items
        return [
            VulnerabilityListItem(
                id=vuln["id"],
                title=vuln["title"],
                fields={"Rating": vuln["fields"].get("Rating", "")}
            )
            for vuln in response
        ]
    
    async def get_all_vulnerability_details(
        self, 
        project_id: int, 
        page: Optional[int] = None
    ) -> List[VulnerabilityListItem]:
        """Get detailed list of vulnerabilities in a project."""
        endpoint = "/pro/api/issues"
        if page:
            endpoint += f"?page={page}"
        
        response = await self._request("GET", endpoint, project_id=project_id)
        
        # Return full details
        return [
            VulnerabilityListItem(
                id=vuln["id"],
                title=vuln["title"],
                fields=vuln["fields"]
            )
            for vuln in response
        ]
    
    async def get_vulnerability(self, project_id: int, vulnerability_id: int) -> Dict[str, Any]:
        """Get a specific vulnerability."""
        response = await self._request(
            "GET", 
            f"/pro/api/issues/{vulnerability_id}", 
            project_id=project_id
        )
        
        # Reconstruct the vulnerability data
        construction = {
            "id": response["id"],
            "author": response["author"],
        }
        
        # Add all fields from the vulnerability
        for key, value in response["fields"].items():
            construction[key] = value
        
        return construction
    
    async def create_vulnerability(
        self, 
        project_id: int, 
        vulnerability: Dict[str, Any]
    ) -> Vulnerability:
        """Create a new vulnerability."""
        compiled_vulnerability = self._construct_dradis_response(vulnerability)
        
        response = await self._request(
            "POST",
            "/pro/api/issues",
            project_id=project_id,
            json={"issue": {"text": compiled_vulnerability}}
        )
        
        return Vulnerability(**response)
    
    async def update_vulnerability(
        self,
        project_id: int,
        issue_id: int,
        vulnerability: Dict[str, Any]
    ) -> Vulnerability:
        """Update an existing vulnerability."""
        # Get current vulnerability
        current_vuln = await self.get_vulnerability(project_id, issue_id)
        
        # Update with new values (only update defined non-empty values)
        updated_vulnerability = current_vuln.copy()
        for key, value in vulnerability.items():
            if isinstance(value, str) and value.strip() or value is not None:
                updated_vulnerability[key] = value
        
        # Construct Dradis format
        dradis_construct = self._construct_dradis_response(updated_vulnerability)
        
        response = await self._request(
            "PUT",
            f"/pro/api/issues/{issue_id}",
            project_id=project_id,
            json={"issue": {"text": dradis_construct}}
        )
        
        return Vulnerability(**response)
    
    async def get_content_blocks(self, project_id: int) -> List[Dict[str, Any]]:
        """Get all content blocks in a project."""
        response = await self._request("GET", "/pro/api/content_blocks", project_id=project_id)
        
        return [
            {
                "id": block["id"],
                "fields": block["fields"]
            }
            for block in response
        ]
    
    async def get_content_block(self, project_id: int, block_id: int) -> ContentBlock:
        """Get a specific content block."""
        response = await self._request(
            "GET", 
            f"/pro/api/content_blocks/{block_id}", 
            project_id=project_id
        )
        return ContentBlock(**response)
    
    async def update_content_block(
        self, 
        project_id: int, 
        block_id: int, 
        content_block: UpdateContentBlock
    ) -> ContentBlock:
        """Update a content block."""
        # Get current content block
        current_block = await self.get_content_block(project_id, block_id)
        
        # Update fields with new content
        for key, value in content_block.content.items():
            if isinstance(value, str):
                current_block.fields[key] = value
        
        # Construct Dradis format
        dradis_construct = self._construct_dradis_response(current_block.fields)
        
        response = await self._request(
            "PUT",
            f"/pro/api/content_blocks/{block_id}",
            project_id=project_id,
            json={
                "content_block": {
                    "block_group": content_block.block_group,
                    "content": dradis_construct
                }
            }
        )
        
        return ContentBlock(**response)
    
    async def get_document_properties(self, project_id: int) -> List[DocumentProperty]:
        """Get all document properties for a project."""
        response = await self._request("GET", "/pro/api/document_properties", project_id=project_id)
        return response
    
    async def upsert_document_property(
        self, 
        project_id: int, 
        property_name: str, 
        value: str
    ) -> DocumentProperty:
        """Create or update a document property."""
        # Check if property exists
        doc_properties = await self.get_document_properties(project_id)
        
        property_exists = any(
            property_name in prop and prop[property_name] is not None 
            for prop in doc_properties
        )
        
        if property_exists:
            # Update existing property
            response = await self._request(
                "PUT",
                f"/pro/api/document_properties/{property_name}",
                project_id=project_id,
                json={"document_property": {"value": value}}
            )
        else:
            # Create new property
            response = await self._request(
                "POST",
                "/pro/api/document_properties",
                project_id=project_id,
                json={"document_properties": {property_name: value}}
            )
        
        return response
