"""Roadmap creation agent using OpenAI Agents SDK."""

import json
from typing import Dict, Any, List, Optional
from agents import Agent, Runner, set_default_openai_key, FunctionTool, tool_context

from config import AgentConfig
from tools import RoadmapUpdater
from tools.roadmap_tool_functions import create_roadmap_tasks, get_project_roadmap
from prompts import SystemPrompts

class RoadmapAgent:
    """AI agent for roadmap task generation and management."""
    
    def __init__(self):
        AgentConfig.validate_config()
        
        # Set up OpenAI key for agents SDK
        set_default_openai_key(AgentConfig.OPENAI_API_KEY)
        
        self.roadmap_updater = RoadmapUpdater()
        
        # Create roadmap management tools
        roadmap_create_tool = FunctionTool(
            name="create_roadmap_tasks",
            description="Create multiple roadmap tasks for a project based on PRD analysis. Use this when you have analyzed a PRD and want to generate actionable tasks.",
            params_json_schema={
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "integer",
                        "description": "The ID of the project to create tasks for"
                    },
                    "tasks": {
                        "type": "array",
                        "description": "Array of task objects to create",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {
                                    "type": "string",
                                    "description": "Task title"
                                },
                                "description": {
                                    "type": "string",
                                    "description": "Detailed task description"
                                },
                                "priority": {
                                    "type": "string",
                                    "enum": ["P0", "P1", "P2", "P3"],
                                    "description": "Task priority (P0=Critical, P1=High, P2=Medium, P3=Low)"
                                },
                                "quarter": {
                                    "type": "string",
                                    "description": "Target quarter (e.g., Q1 2024, Q2 2024)"
                                },
                                "estimated_effort": {
                                    "type": "string",
                                    "description": "Effort estimate (Small, Medium, Large)"
                                },
                                "dependencies": {
                                    "type": "string",
                                    "description": "JSON array of dependent task IDs or descriptions"
                                }
                            },
                            "required": ["title", "quarter"]
                        }
                    }
                },
                "required": ["project_id", "tasks"]
            },
            on_invoke_tool=self._handle_create_roadmap_tasks_tool
        )
        
        roadmap_get_tool = FunctionTool(
            name="get_project_roadmap",
            description="Get existing roadmap tasks for a project",
            params_json_schema={
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "integer",
                        "description": "The ID of the project"
                    }
                },
                "required": ["project_id"]
            },
            on_invoke_tool=self._handle_get_roadmap_tool
        )
        
        # Create the agent with roadmap management tools
        self.agent = Agent(
            name="Roadmap Planning Assistant",
            instructions=self._get_base_instructions(),
            model=AgentConfig.OPENAI_MODEL,
            tools=[roadmap_create_tool, roadmap_get_tool]
        )
        
        self.conversation_history: List[Dict[str, Any]] = []
    
    async def _handle_create_roadmap_tasks_tool(self, context, params: str) -> str:
        """Handle the create_roadmap_tasks tool call."""
        try:
            import json
            params_dict = json.loads(params)
            project_id = params_dict["project_id"]
            tasks = params_dict["tasks"]
            
            result = await create_roadmap_tasks(project_id, tasks)
            return result
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Error creating roadmap tasks: {str(e)}"
            })
    
    async def _handle_get_roadmap_tool(self, context, params: str) -> str:
        """Handle the get_project_roadmap tool call."""
        try:
            import json
            params_dict = json.loads(params)
            project_id = params_dict["project_id"]
            
            result = await get_project_roadmap(project_id)
            return result
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": f"Error getting roadmap: {str(e)}"
            })
    
    def _get_base_instructions(self) -> str:
        """Get base instructions for the roadmap agent."""
        return """You are a Roadmap Planning Assistant, an expert product manager specializing in breaking down Product Requirements Documents (PRDs) into actionable roadmap tasks.

Your core responsibilities:
1. Analyze PRD content to identify key features, requirements, and deliverables
2. Break down complex features into manageable, actionable tasks
3. Assign realistic priorities based on business impact and technical complexity
4. Estimate effort levels and create realistic quarterly timelines
5. Identify task dependencies and optimal sequencing

When generating roadmap tasks:
- Create specific, actionable task titles (not vague descriptions)
- Include detailed descriptions with acceptance criteria
- Assign priorities: P0 (Critical/Blocker), P1 (High), P2 (Medium), P3 (Low)
- Distribute tasks across realistic quarters (don't overload any single quarter)
- Use effort estimates: Small (1-2 weeks), Medium (3-6 weeks), Large (7+ weeks)
- Consider dependencies between tasks (frontend depends on backend, etc.)

Task breakdown principles:
- Each task should be completable by a small team in 1-6 weeks
- Include both development and non-development tasks (design, research, testing)
- Consider infrastructure, security, and scalability requirements
- Include launch preparation tasks (documentation, training, rollout)

Priority guidelines:
- P0: Critical path items, blockers, security/compliance requirements
- P1: Core features, major user-facing functionality
- P2: Important enhancements, nice-to-have features
- P3: Future improvements, technical debt, optimizations

Always use the create_roadmap_tasks tool when you have substantial roadmap content to save."""
    
    async def generate_roadmap_from_prd(self, project_id: int, prd_content: str, 
                                      existing_roadmap: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Generate roadmap tasks from PRD content."""
        
        # Build context for the agent
        context_info = f"""
PROJECT ID: {project_id}

PRD CONTENT:
{prd_content}

EXISTING ROADMAP TASKS:
{json.dumps(existing_roadmap or [], indent=2)}

TASK: Analyze the PRD content above and generate a comprehensive roadmap of actionable tasks. 

Consider:
1. All features and requirements mentioned in the PRD
2. Technical implementation needs (backend, frontend, database, APIs)
3. Non-technical tasks (design, research, testing, documentation)
4. Infrastructure and deployment requirements
5. Launch and rollout activities

Create tasks that are:
- Specific and actionable
- Properly prioritized based on business impact
- Realistically distributed across quarters
- Include effort estimates and dependencies

Use the create_roadmap_tasks tool to save the generated roadmap.
"""
        
        try:
            # Run the agent with the PRD analysis prompt
            result = await Runner.run(self.agent, context_info)
            
            return {
                "content": result.final_output,
                "type": "roadmap_generation",
                "metadata": {
                    "mode": "prd_analysis",
                    "project_id": project_id,
                    "has_existing_roadmap": bool(existing_roadmap)
                }
            }
            
        except Exception as e:
            return {
                "content": f"I encountered an error while generating the roadmap: {str(e)}. Please try again or provide more specific information.",
                "type": "error"
            }
    
    async def chat(self, user_message: str, project_context: Optional[Dict[str, Any]] = None,
                   chat_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Main chat interface for roadmap planning."""
        
        # Use provided chat history if available, otherwise use internal history
        if chat_history:
            # Convert chat history to internal format and replace internal history
            self.conversation_history = []
            for msg in chat_history:
                self.conversation_history.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                    "timestamp": msg.get("timestamp", self._get_timestamp()),
                    "metadata": msg.get("metadata", {})
                })
        
        # Add current user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": self._get_timestamp()
        })
        
        # Generate AI response
        response = await self._generate_roadmap_response(user_message, project_context)
        
        # Add assistant response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": response["content"],
            "timestamp": self._get_timestamp(),
            "metadata": response.get("metadata", {})
        })
        
        return response
    
    async def _generate_roadmap_response(self, user_message: str, 
                                       project_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate roadmap response using OpenAI Agents SDK."""
        try:
            # Get project ID for tool usage
            project_id = None
            if project_context and project_context.get("project_id"):
                project_id = project_context["project_id"]
            
            # Build context for the agent
            context_parts = [f"USER REQUEST: {user_message}"]
            
            if project_id:
                context_parts.append(f"PROJECT ID: {project_id}")
            
            if project_context:
                if project_context.get("existing_prd"):
                    context_parts.append(f"PRD CONTENT:\n{project_context['existing_prd']}")
                
                if project_context.get("existing_roadmap"):
                    context_parts.append(f"EXISTING ROADMAP:\n{json.dumps(project_context['existing_roadmap'], indent=2)}")
            
            context_parts.append("""
You are helping with roadmap planning. If the user wants to generate roadmap tasks from a PRD, analyze the PRD content and create actionable tasks using the create_roadmap_tasks tool.

When creating tasks, ensure they are:
- Specific and actionable
- Properly prioritized (P0-P3)
- Distributed across realistic quarters
- Include effort estimates and dependencies
""")
            
            prompt = "\n\n".join(context_parts)
            
            # Run the agent
            result = await Runner.run(self.agent, prompt)
            
            return {
                "content": result.final_output,
                "type": "roadmap_content",
                "metadata": {
                    "project_id": project_id,
                    "mode": "chat_response"
                }
            }
            
        except Exception as e:
            return {
                "content": f"I encountered an error while processing your roadmap request: {str(e)}. Please try again or provide more specific information.",
                "type": "error"
            }
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history."""
        return self.conversation_history.copy()
    
    def clear_conversation(self):
        """Clear conversation history."""
        self.conversation_history.clear()
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()
