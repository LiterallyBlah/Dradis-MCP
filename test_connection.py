#!/usr/bin/env python3
"""
Simple test script to verify the Dradis MCP server functionality.
This replaces the original test-connection.js script.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from dradis_mcp.config import load_config
from dradis_mcp.api import DradisAPI


async def test_connection():
    """Test connection to Dradis API."""
    try:
        print("Testing Dradis API connection...")
        
        # Load configuration
        config = load_config()
        print(f"Loaded config for: {config.dradis_url}")
        
        # Create API client
        async with DradisAPI(config) as api:
            # Try to get project details for project ID 1
            project = await api.get_project_details(1)
            print(f"✅ Connection successful!")
            print(f"Test project: {project.name} (ID: {project.id})")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    return True


async def main():
    """Main test function."""
    print("Dradis MCP Connection Test")
    print("=" * 30)
    
    success = await test_connection()
    
    if success:
        print("\n🎉 All tests passed! The server should work correctly.")
        sys.exit(0)
    else:
        print("\n💥 Tests failed. Please check your configuration.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
