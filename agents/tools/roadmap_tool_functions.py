"""Tool functions for roadmap task management."""

import json
from typing import List, Dict, Any, Optional
from .roadmap_updater import RoadmapUpdater

# Initialize the roadmap updater
roadmap_updater = RoadmapUpdater()

async def create_roadmap_tasks(project_id: int, tasks: List[Dict[str, Any]]) -> str:
    """
    Create multiple roadmap tasks for a project.
    
    Args:
        project_id: The ID of the project
        tasks: List of task dictionaries with title, description, priority, quarter, etc.
    
    Returns:
        JSON string with success message and created tasks
    """
    try:
        # Validate tasks
        for task in tasks:
            if not task.get('title') or not task.get('quarter'):
                return json.dumps({
                    "success": False,
                    "error": "Each task must have a title and quarter"
                })
        
        # Create tasks via API
        result = await roadmap_updater.create_multiple_tasks(project_id, tasks)
        
        if result.get("success"):
            return json.dumps({
                "success": True,
                "message": f"Successfully created {len(result.get('tasks', []))} roadmap tasks",
                "tasks": result.get("tasks", [])
            })
        else:
            return json.dumps({
                "success": False,
                "error": result.get("error", "Failed to create roadmap tasks")
            })
            
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error creating roadmap tasks: {str(e)}"
        })

async def get_project_roadmap(project_id: int) -> str:
    """
    Get all roadmap tasks for a project.
    
    Args:
        project_id: The ID of the project
    
    Returns:
        JSON string with roadmap tasks
    """
    try:
        result = await roadmap_updater.get_project_roadmap(project_id)
        
        if result.get("success"):
            return json.dumps({
                "success": True,
                "tasks": result.get("tasks", [])
            })
        else:
            return json.dumps({
                "success": False,
                "error": result.get("error", "Failed to fetch roadmap")
            })
            
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error fetching roadmap: {str(e)}"
        })

async def update_roadmap_task(task_id: int, updates: Dict[str, Any]) -> str:
    """
    Update a specific roadmap task.
    
    Args:
        task_id: The ID of the task to update
        updates: Dictionary of fields to update
    
    Returns:
        JSON string with success message and updated task
    """
    try:
        result = await roadmap_updater.update_task(task_id, updates)
        
        if result.get("success"):
            return json.dumps({
                "success": True,
                "message": "Successfully updated roadmap task",
                "task": result.get("task")
            })
        else:
            return json.dumps({
                "success": False,
                "error": result.get("error", "Failed to update roadmap task")
            })
            
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error updating roadmap task: {str(e)}"
        })

async def delete_roadmap_task(task_id: int) -> str:
    """
    Delete a specific roadmap task.
    
    Args:
        task_id: The ID of the task to delete
    
    Returns:
        JSON string with success message
    """
    try:
        result = await roadmap_updater.delete_task(task_id)
        
        if result.get("success"):
            return json.dumps({
                "success": True,
                "message": "Successfully deleted roadmap task"
            })
        else:
            return json.dumps({
                "success": False,
                "error": result.get("error", "Failed to delete roadmap task")
            })
            
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error deleting roadmap task: {str(e)}"
        })

async def clear_project_roadmap(project_id: int) -> str:
    """
    Clear all roadmap tasks for a project.
    
    Args:
        project_id: The ID of the project
    
    Returns:
        JSON string with success message
    """
    try:
        result = await roadmap_updater.clear_project_roadmap(project_id)
        
        if result.get("success"):
            return json.dumps({
                "success": True,
                "message": "Successfully cleared project roadmap"
            })
        else:
            return json.dumps({
                "success": False,
                "error": result.get("error", "Failed to clear project roadmap")
            })
            
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error clearing project roadmap: {str(e)}"
        })
