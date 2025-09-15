"""HTTP client for roadmap task operations."""

import aiohttp
import json
from typing import Dict, Any, List, Optional
from config import AgentConfig

class RoadmapUpdater:
    """Handles HTTP communication with the backend API for roadmap tasks."""
    
    def __init__(self):
        self.base_url = AgentConfig.BACKEND_URL
        self.timeout = aiohttp.ClientTimeout(total=30)
    
    async def create_multiple_tasks(self, project_id: int, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create multiple roadmap tasks for a project."""
        url = f"{self.base_url}/api/projects/{project_id}/roadmap/bulk"
        
        payload = {"tasks": tasks}
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 201:
                        created_tasks = await response.json()
                        return {
                            "success": True,
                            "tasks": created_tasks
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def create_task(self, project_id: int, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a single roadmap task for a project."""
        url = f"{self.base_url}/api/projects/{project_id}/roadmap"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(url, json=task_data) as response:
                    if response.status == 201:
                        created_task = await response.json()
                        return {
                            "success": True,
                            "task": created_task
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def get_project_roadmap(self, project_id: int) -> Dict[str, Any]:
        """Get all roadmap tasks for a project."""
        url = f"{self.base_url}/api/projects/{project_id}/roadmap"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        tasks = await response.json()
                        return {
                            "success": True,
                            "tasks": tasks
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def get_task(self, task_id: int) -> Dict[str, Any]:
        """Get a specific roadmap task."""
        url = f"{self.base_url}/api/roadmap/{task_id}"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        task = await response.json()
                        return {
                            "success": True,
                            "task": task
                        }
                    elif response.status == 404:
                        return {
                            "success": False,
                            "error": "Roadmap task not found"
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def update_task(self, task_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a specific roadmap task."""
        url = f"{self.base_url}/api/roadmap/{task_id}"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.put(url, json=updates) as response:
                    if response.status == 200:
                        updated_task = await response.json()
                        return {
                            "success": True,
                            "task": updated_task
                        }
                    elif response.status == 404:
                        return {
                            "success": False,
                            "error": "Roadmap task not found"
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def delete_task(self, task_id: int) -> Dict[str, Any]:
        """Delete a specific roadmap task."""
        url = f"{self.base_url}/api/roadmap/{task_id}"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.delete(url) as response:
                    if response.status == 204:
                        return {
                            "success": True
                        }
                    elif response.status == 404:
                        return {
                            "success": False,
                            "error": "Roadmap task not found"
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def clear_project_roadmap(self, project_id: int) -> Dict[str, Any]:
        """Clear all roadmap tasks for a project."""
        url = f"{self.base_url}/api/projects/{project_id}/roadmap"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.delete(url) as response:
                    if response.status == 204:
                        return {
                            "success": True
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def get_tasks_by_quarter(self, project_id: int, quarter: str) -> Dict[str, Any]:
        """Get roadmap tasks for a specific quarter."""
        url = f"{self.base_url}/api/projects/{project_id}/roadmap/quarter/{quarter}"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        tasks = await response.json()
                        return {
                            "success": True,
                            "tasks": tasks
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
    
    async def get_tasks_by_status(self, project_id: int, status: str) -> Dict[str, Any]:
        """Get roadmap tasks by status."""
        url = f"{self.base_url}/api/projects/{project_id}/roadmap/status/{status}"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        tasks = await response.json()
                        return {
                            "success": True,
                            "tasks": tasks
                        }
                    else:
                        error_data = await response.json()
                        return {
                            "success": False,
                            "error": error_data.get("error", f"HTTP {response.status}")
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
