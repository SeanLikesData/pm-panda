"""Spec creation agent using OpenAI Agents SDK."""

import json
from typing import Dict, Any, List, Optional
from agents import Agent, Runner, set_default_openai_key, FunctionTool, tool_context

from config import AgentConfig
from tools import TemplateLoader, PRDValidator, PRDUpdater
from tools.spec_tool_functions import update_project_spec, get_project_spec
from prompts import SystemPrompts

class SpecAgent:
    """AI agent for technical specification creation and management."""
    
    def __init__(self):
        AgentConfig.validate_config()
        
        # Set up OpenAI key for agents SDK
        set_default_openai_key(AgentConfig.OPENAI_API_KEY)
        
        self.template_loader = TemplateLoader(AgentConfig.TEMPLATES_PATH)
        self.validator = PRDValidator()  # Can reuse for basic validation
        
        # Create Spec management tools
        spec_update_tool = FunctionTool(
            name="update_project_spec",
            description="Update or create a technical specification for a project. Use this when you have substantial spec content to save.",
            params_json_schema={
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "integer",
                        "description": "The ID of the project to update"
                    },
                    "content": {
                        "type": "string",
                        "description": "The specification content in markdown format"
                    },
                    "technical_details": {
                        "type": "string",
                        "description": "Additional technical implementation details"
                    },
                    "title": {
                        "type": "string",
                        "description": "Optional title for the specification (used when creating new spec)"
                    }
                },
                "required": ["project_id", "content"]
            },
            on_invoke_tool=self._handle_update_spec_tool
        )
        
        spec_get_tool = FunctionTool(
            name="get_project_spec",
            description="Get the current technical specification content for a project",
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
            on_invoke_tool=self._handle_get_spec_tool
        )
        
        # Create the agent with Spec management tools
        self.agent = Agent(
            name=f"{AgentConfig.AGENT_NAME}_Spec",
            instructions=self._get_base_instructions(),
            model=AgentConfig.OPENAI_MODEL,
            tools=[spec_update_tool, spec_get_tool]
        )
        
        self.conversation_history: List[Dict[str, Any]] = []
        self.current_template: Optional[str] = None
        self.current_spec_data: Dict[str, Any] = {}
    
    async def _handle_update_spec_tool(self, context, params: str) -> str:
        """Handle the update_project_spec tool call."""
        try:
            import json
            params_dict = json.loads(params)
            project_id = params_dict["project_id"]
            content = params_dict["content"]
            technical_details = params_dict.get("technical_details")
            title = params_dict.get("title")
            
            result = await update_project_spec(project_id, content, technical_details, title)
            return result
        except Exception as e:
            return f"Error updating specification: {str(e)}"
    
    async def _handle_get_spec_tool(self, context, params: str) -> str:
        """Handle the get_project_spec tool call."""
        try:
            import json
            params_dict = json.loads(params)
            project_id = params_dict["project_id"]
            
            result = await get_project_spec(project_id)
            return result
        except Exception as e:
            return f"Error getting specification: {str(e)}"
    
    def _get_base_instructions(self) -> str:
        """Get base instructions for the spec agent."""
        return SystemPrompts.SPEC_BASE_SYSTEM_PROMPT
    
    async def chat(self, user_message: str, template_type: str = "api", 
                   project_context: Optional[Dict[str, Any]] = None,
                   chat_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Main chat interface for technical specification creation."""
        
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
        
        # Set current template if provided
        if template_type:
            self.current_template = template_type
        
        # Update current spec data if existing spec is provided
        if project_context and project_context.get("existing_spec"):
            self.current_spec_data = {"existing_content": project_context["existing_spec"]}
        
        # Generate AI response
        response = await self._generate_spec_response(user_message, template_type, project_context, chat_history)
        
        # Add assistant response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": response["content"],
            "timestamp": self._get_timestamp(),
            "metadata": response.get("metadata", {})
        })
        
        return response
    
    def _detect_answer_for_me_request(self, user_message: str) -> bool:
        """Detect if user is asking the agent to answer questions or make assumptions."""
        answer_phrases = [
            "answer the questions for me",
            "fill in reasonable defaults",
            "make assumptions",
            "use your best judgment",
            "create a sample",
            "create an example",
            "fill in the blanks",
            "answer for me",
            "make reasonable assumptions",
            "use industry best practices",
            "create a template",
            "generate with defaults",
            "design the architecture",
            "create the technical design",
            "specify the implementation"
        ]
        
        user_message_lower = user_message.lower()
        return any(phrase in user_message_lower for phrase in answer_phrases)

    async def _generate_spec_response(self, user_message: str, template_type: str, project_context: Optional[Dict[str, Any]] = None, chat_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Generate technical specification content response using OpenAI Agents SDK."""
        try:
            # Determine if we have existing spec content
            existing_spec = ""
            has_existing_spec = False
            
            if project_context:
                existing_spec = project_context.get("existing_spec", "")
                has_existing_spec = project_context.get("has_existing_spec", False)
            
            # Check if user wants agent to make assumptions
            should_make_assumptions = self._detect_answer_for_me_request(user_message)
            
            # Build context for the agent
            agent_context = {
                "current_spec": existing_spec if existing_spec else json.dumps(self.current_spec_data, indent=2),
                "template_sections": str(self.template_loader.get_spec_template_sections(template_type))
            }
            
            # Update agent instructions with template-specific context
            template_context = SystemPrompts.build_spec_system_prompt(
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
            if has_existing_spec and existing_spec.strip():
                # UPDATE MODE - working with existing spec
                prompt = f"""
EXISTING SPECIFICATION CONTENT:
{existing_spec}

USER REQUEST: {user_message}

PROJECT ID: {project_id}

You are in UPDATE MODE. The user wants to modify or enhance the existing technical specification above. 
Focus on their specific request and update the relevant sections while maintaining consistency with existing content.
Do NOT ask for basic information that's already present in the existing specification.

When you have substantial specification content to save, use the update_project_spec tool with the project ID above.
"""
            else:
                # CREATION MODE - starting fresh
                if should_make_assumptions:
                    prompt = f"""
USER REQUEST: {user_message}

PROJECT ID: {project_id}

The user has requested you to make assumptions and create technical specification content. Use your technical expertise to:
1. Make reasonable assumptions based on industry best practices and modern architecture patterns
2. Generate comprehensive specification content using the {template_type} template
3. Include detailed technical implementation guidance
4. Create realistic examples, schemas, and API definitions
5. Suggest areas where the user should provide specific technical details later
6. Consider scalability, security, and maintainability aspects

Generate a complete technical specification that serves as a starting point for development.

When you have substantial specification content to save, use the update_project_spec tool with the project ID above.
"""
                else:
                    prompt = f"""
Create technical specification content using {template_type} template: {user_message}

PROJECT ID: {project_id}

Focus on technical accuracy, implementation details, and clear specifications that developers can follow.

When you have substantial specification content to save, use the update_project_spec tool with the project ID above.
"""
            
            # Run the agent with the appropriate prompt
            result = await Runner.run(agent_with_context, prompt)
            
            # Check if tools were called by examining the result
            tool_calls_made = hasattr(result, 'tool_calls') and len(result.tool_calls) > 0
            
            # Also check if the result contains any tool usage indicators
            if not tool_calls_made and hasattr(result, 'messages'):
                for message in result.messages:
                    if hasattr(message, 'tool_calls') and message.tool_calls:
                        tool_calls_made = True
                        break
            
            return {
                "content": result.final_output,
                "type": "spec_content",
                "template_type": template_type,
                "metadata": {
                    "sections_generated": list(self.template_loader.get_spec_template_sections(template_type).keys()),
                    "mode": "update" if has_existing_spec else "create",
                    "tool_calls_made": tool_calls_made,
                    "assumptions_made": should_make_assumptions
                }
            }
            
        except Exception as e:
            return {
                "content": f"I encountered an error while generating the technical specification: {str(e)}. Please try again or provide more specific information.",
                "type": "error"
            }
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history."""
        return self.conversation_history.copy()
    
    def clear_conversation(self):
        """Clear conversation history."""
        self.conversation_history.clear()
        self.current_spec_data.clear()
    
    def get_available_templates(self) -> List[str]:
        """Get available spec template types."""
        return self.template_loader.get_available_spec_templates()
    
    def get_template_info(self, template_type: str) -> Dict[str, Any]:
        """Get information about a specific spec template."""
        return self.template_loader.get_spec_template_info(template_type)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()
