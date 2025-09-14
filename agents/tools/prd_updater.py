"""PRD updater tool for AI agents."""

import httpx
from typing import Dict, Any, Optional
import json

class PRDUpdater:
    """Tool for updating PRDs via backend API."""
    
    def __init__(self, backend_url: str = "http://localhost:4000"):
        self.backend_url = backend_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def update_prd(self, project_id: int, content: str, title: Optional[str] = None) -> Dict[str, Any]:
        """Update or create PRD for a project."""
        try:
            # First try to update existing PRD
            update_data = {
                "content": content,
                "status": "draft"
            }
            
            try:
                response = await self.client.put(
                    f"{self.backend_url}/api/projects/{project_id}/prd",
                    json=update_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "action": "updated",
                        "message": "PRD updated successfully",
                        "data": response.json()
                    }
                elif response.status_code == 404:
                    # PRD doesn't exist, create new one
                    create_data = {
                        "title": title or "Product Requirements Document",
                        "content": content,
                        "status": "draft"
                    }
                    
                    create_response = await self.client.post(
                        f"{self.backend_url}/api/projects/{project_id}/prd",
                        json=create_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if create_response.status_code == 201:
                        return {
                            "success": True,
                            "action": "created",
                            "message": "PRD created successfully",
                            "data": create_response.json()
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"Failed to create PRD: {create_response.status_code}",
                            "details": create_response.text
                        }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to update PRD: {response.status_code}",
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
    
    async def get_prd(self, project_id: int) -> Dict[str, Any]:
        """Get existing PRD for a project."""
        try:
            response = await self.client.get(f"{self.backend_url}/api/projects/{project_id}/prd")
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json()
                }
            elif response.status_code == 404:
                return {
                    "success": True,
                    "data": None,
                    "message": "No PRD found for this project"
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to get PRD: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting PRD: {str(e)}"
            }
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
