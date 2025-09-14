"""PRD creation agent using OpenAI Agents SDK."""

import json
from typing import Dict, Any, List, Optional
from agents import Agent, Runner, set_default_openai_key, FunctionTool, tool_context

from config import AgentConfig
from tools import TemplateLoader, PRDValidator, PRDUpdater
from tools.prd_tool_functions import update_project_prd, get_project_prd
from prompts import SystemPrompts

class PRDAgent:
    """AI agent for PRD creation and management."""
    
    def __init__(self):
        AgentConfig.validate_config()
        
        # Set up OpenAI key for agents SDK
        set_default_openai_key(AgentConfig.OPENAI_API_KEY)
        
        self.template_loader = TemplateLoader(AgentConfig.TEMPLATES_PATH)
        self.validator = PRDValidator()
        
        # Create PRD management tools
        prd_update_tool = FunctionTool(
            name="update_project_prd",
            description="Update or create a PRD for a project. Use this when you have substantial PRD content to save.",
            params_json_schema={
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "integer",
                        "description": "The ID of the project to update"
                    },
                    "content": {
                        "type": "string",
                        "description": "The PRD content in markdown format"
                    },
                    "title": {
                        "type": "string",
                        "description": "Optional title for the PRD (used when creating new PRD)"
                    }
                },
                "required": ["project_id", "content"]
            },
            on_invoke_tool=self._handle_update_prd_tool
        )
        
        prd_get_tool = FunctionTool(
            name="get_project_prd",
            description="Get the current PRD content for a project",
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
            on_invoke_tool=self._handle_get_prd_tool
        )
        
        # Create the agent with PRD management tools
        self.agent = Agent(
            name=AgentConfig.AGENT_NAME,
            instructions=self._get_base_instructions(),
            model=AgentConfig.OPENAI_MODEL,
            tools=[prd_update_tool, prd_get_tool]
        )
        
        self.conversation_history: List[Dict[str, Any]] = []
        self.current_template: Optional[str] = None
        self.current_prd_data: Dict[str, Any] = {}
    
    async def _handle_update_prd_tool(self, context, params: str) -> str:
        """Handle the update_project_prd tool call."""
        try:
            import json
            params_dict = json.loads(params)
            project_id = params_dict["project_id"]
            content = params_dict["content"]
            title = params_dict.get("title")
            
            result = await update_project_prd(project_id, content, title)
            return result
        except Exception as e:
            return f"Error updating PRD: {str(e)}"
    
    async def _handle_get_prd_tool(self, context, params: str) -> str:
        """Handle the get_project_prd tool call."""
        try:
            import json
            params_dict = json.loads(params)
            project_id = params_dict["project_id"]
            
            result = await get_project_prd(project_id)
            return result
        except Exception as e:
            return f"Error getting PRD: {str(e)}"
    
    def _get_base_instructions(self) -> str:
        """Get base instructions for the agent."""
        return SystemPrompts.BASE_SYSTEM_PROMPT
    
    async def chat(self, user_message: str, template_type: str = "lean", 
                   project_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Main chat interface for PRD creation."""
        
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": self._get_timestamp()
        })
        
        # Set current template if provided
        if template_type:
            self.current_template = template_type
        
        # Update current PRD data if existing PRD is provided
        if project_context and project_context.get("existing_prd"):
            self.current_prd_data = {"existing_content": project_context["existing_prd"]}
        
        # Always generate AI response - no rule-based templated responses
        response = await self._generate_prd_response(user_message, template_type, project_context)
        
        # Add assistant response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": response["content"],
            "timestamp": self._get_timestamp(),
            "metadata": response.get("metadata", {})
        })
        
        return response
    
    async def _generate_prd_response(self, user_message: str, template_type: str, project_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate PRD content response using OpenAI Agents SDK."""
        try:
            # Determine if we have existing PRD content
            existing_prd = ""
            has_existing_prd = False
            
            if project_context:
                existing_prd = project_context.get("existing_prd", "")
                has_existing_prd = project_context.get("has_existing_prd", False)
            
            # Build context for the agent
            agent_context = {
                "current_prd": existing_prd if existing_prd else json.dumps(self.current_prd_data, indent=2),
                "template_sections": str(self.template_loader.get_template_sections(template_type))
            }
            
            # Update agent instructions with template-specific context
            template_context = SystemPrompts.build_system_prompt(
                template_type=template_type,
                context=agent_context
            )
            
            # Create a new agent instance with updated instructions and tools
            agent_with_context = Agent(
                name=self.agent.name,
                instructions=template_context,
                model=self.agent.model,
                tools=self.agent.tools  # Use the same tools as the main agent
            )
            
            # Get project ID for tool usage
            project_id = None
            if project_context and project_context.get("project_id"):
                project_id = project_context["project_id"]
            
            # Determine the mode and create appropriate prompt
            if has_existing_prd and existing_prd.strip():
                # UPDATE MODE - working with existing PRD
                prompt = f"""
EXISTING PRD CONTENT:
{existing_prd}

USER REQUEST: {user_message}

PROJECT ID: {project_id}

You are in UPDATE MODE. The user wants to modify or enhance the existing PRD above. 
Focus on their specific request and update the relevant sections while maintaining consistency with existing content.
Do NOT ask for basic information that's already present in the existing PRD.

When you have substantial PRD content to save, use the update_project_prd tool with the project ID above.
"""
            else:
                # CREATION MODE - starting fresh
                prompt = f"""
Create PRD content using {template_type} template: {user_message}

PROJECT ID: {project_id}

When you have substantial PRD content to save, use the update_project_prd tool with the project ID above.
"""
            
            # Run the agent with the appropriate prompt
            result = await Runner.run(agent_with_context, prompt)
            
            # Check if tools were called by examining the result
            tool_calls_made = hasattr(result, 'tool_calls') and len(result.tool_calls) > 0
            
            return {
                "content": result.final_output,
                "type": "prd_content",
                "template_type": template_type,
                "metadata": {
                    "sections_generated": list(self.template_loader.get_template_sections(template_type).keys()),
                    "mode": "update" if has_existing_prd else "create",
                    "tool_calls_made": tool_calls_made
                }
            }
            
        except Exception as e:
            return {
                "content": f"I encountered an error while generating the PRD: {str(e)}. Please try again or provide more specific information.",
                "type": "error"
            }
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history."""
        return self.conversation_history.copy()
    
    def clear_conversation(self):
        """Clear conversation history."""
        self.conversation_history.clear()
        self.current_prd_data.clear()
    
    def get_available_templates(self) -> List[str]:
        """Get available template types."""
        return self.template_loader.get_available_templates()
    
    def get_template_info(self, template_type: str) -> Dict[str, Any]:
        """Get information about a specific template."""
        return self.template_loader.get_template_info(template_type)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()
