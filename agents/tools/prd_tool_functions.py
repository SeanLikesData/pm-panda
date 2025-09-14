"""Tool functions for OpenAI Agents SDK."""

import asyncio
from typing import Dict, Any, Optional
from .prd_updater import PRDUpdater

# Global PRD updater instance
_prd_updater = None

def get_prd_updater():
    """Get or create PRD updater instance."""
    global _prd_updater
    if _prd_updater is None:
        _prd_updater = PRDUpdater()
    return _prd_updater

async def update_project_prd(project_id: int, content: str, title: Optional[str] = None) -> str:
    """
    Update or create a PRD for a project.
    
    Args:
        project_id: The ID of the project to update
        content: The PRD content in markdown format
        title: Optional title for the PRD (used when creating new PRD)
    
    Returns:
        A message indicating the result of the operation
    """
    try:
        updater = get_prd_updater()
        result = await updater.update_prd(project_id, content, title)
        
        if result["success"]:
            action = result.get("action", "updated")
            return f"PRD {action} successfully for project {project_id}. {result.get('message', '')}"
        else:
            return f"Failed to update PRD: {result.get('error', 'Unknown error')}"
            
    except Exception as e:
        return f"Error updating PRD: {str(e)}"

async def get_project_prd(project_id: int) -> str:
    """
    Get the current PRD for a project.
    
    Args:
        project_id: The ID of the project
    
    Returns:
        The PRD content or a message if not found
    """
    try:
        updater = get_prd_updater()
        result = await updater.get_prd(project_id)
        
        if result["success"]:
            if result.get("data"):
                return result["data"].get("content", "No content found")
            else:
                return "No PRD found for this project"
        else:
            return f"Error getting PRD: {result.get('error', 'Unknown error')}"
            
    except Exception as e:
        return f"Error getting PRD: {str(e)}"
