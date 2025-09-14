"""Tool functions for Spec management using OpenAI Agents SDK."""

import asyncio
from typing import Dict, Any, Optional
from .spec_updater import SpecUpdater

# Global Spec updater instance
_spec_updater = None

def get_spec_updater():
    """Get or create Spec updater instance."""
    global _spec_updater
    if _spec_updater is None:
        _spec_updater = SpecUpdater()
    return _spec_updater

async def update_project_spec(project_id: int, content: str, technical_details: Optional[str] = None, title: Optional[str] = None) -> str:
    """
    Update or create a technical specification for a project.
    
    Args:
        project_id: The ID of the project to update
        content: The specification content in markdown format
        technical_details: Additional technical implementation details
        title: Optional title for the specification (used when creating new spec)
    
    Returns:
        A message indicating the result of the operation
    """
    try:
        updater = get_spec_updater()
        result = await updater.update_spec(project_id, content, technical_details, title)
        
        if result["success"]:
            action = result.get("action", "updated")
            return f"Technical specification {action} successfully for project {project_id}. {result.get('message', '')}"
        else:
            return f"Failed to update specification: {result.get('error', 'Unknown error')}"
            
    except Exception as e:
        return f"Error updating specification: {str(e)}"

async def get_project_spec(project_id: int) -> str:
    """
    Get the current technical specification for a project.
    
    Args:
        project_id: The ID of the project
    
    Returns:
        The specification content or a message if not found
    """
    try:
        updater = get_spec_updater()
        result = await updater.get_spec(project_id)
        
        if result["success"]:
            if result.get("data"):
                spec_data = result["data"]
                content = spec_data.get("content", "No content found")
                technical_details = spec_data.get("technical_details", "")
                
                # Combine content and technical details if both exist
                if technical_details:
                    return f"{content}\n\n## Technical Implementation Details\n\n{technical_details}"
                else:
                    return content
            else:
                return "No technical specification found for this project"
        else:
            return f"Error getting specification: {result.get('error', 'Unknown error')}"
            
    except Exception as e:
        return f"Error getting specification: {str(e)}"
