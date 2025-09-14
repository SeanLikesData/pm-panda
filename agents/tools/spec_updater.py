"""Spec updater tool for AI agents."""

import httpx
from typing import Dict, Any, Optional
import json

class SpecUpdater:
    """Tool for updating technical specifications via backend API."""
    
    def __init__(self, backend_url: str = "http://localhost:4000"):
        self.backend_url = backend_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def update_spec(self, project_id: int, content: str, technical_details: Optional[str] = None, title: Optional[str] = None) -> Dict[str, Any]:
        """Update or create technical specification for a project."""
        try:
            # First try to update existing spec
            update_data = {
                "content": content,
                "status": "draft"
            }
            
            if technical_details:
                update_data["technical_details"] = technical_details
            
            try:
                response = await self.client.put(
                    f"{self.backend_url}/api/projects/{project_id}/spec",
                    json=update_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "action": "updated",
                        "message": "Technical specification updated successfully",
                        "data": response.json()
                    }
                elif response.status_code == 404:
                    # Spec doesn't exist, create new one
                    create_data = {
                        "title": title or "Technical Specification",
                        "content": content,
                        "status": "draft"
                    }
                    
                    if technical_details:
                        create_data["technical_details"] = technical_details
                    
                    create_response = await self.client.post(
                        f"{self.backend_url}/api/projects/{project_id}/spec",
                        json=create_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if create_response.status_code == 201:
                        return {
                            "success": True,
                            "action": "created",
                            "message": "Technical specification created successfully",
                            "data": create_response.json()
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"Failed to create specification: {create_response.status_code}",
                            "details": create_response.text
                        }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to update specification: {response.status_code}",
                        "details": response.text
                    }
                    
            except httpx.RequestError as e:
                return {
                    "success": False,
                    "error": f"Network error: {str(e)}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    async def get_spec(self, project_id: int) -> Dict[str, Any]:
        """Get existing technical specification for a project."""
        try:
            response = await self.client.get(f"{self.backend_url}/api/projects/{project_id}/spec")
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json()
                }
            elif response.status_code == 404:
                return {
                    "success": True,
                    "data": None,
                    "message": "No technical specification found for this project"
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to get specification: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting specification: {str(e)}"
            }
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
