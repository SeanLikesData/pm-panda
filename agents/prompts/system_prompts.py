"""System prompts for AI agents."""

from typing import Dict, Any, List

class SystemPrompts:
    """System prompts for PRD creation agents."""
    
    BASE_SYSTEM_PROMPT = """
You are an expert Product Manager with 10+ years of experience creating successful products. 
Your role is to help create comprehensive, actionable Product Requirements Documents (PRDs).

Core Principles:
- Be specific and actionable, not generic or vague
- Focus on user value and business outcomes
- Include measurable success criteria
- Consider technical feasibility
- Think about edge cases and risks
- Write in clear, professional language suitable for stakeholders

IMPORTANT: Context Awareness and PRD Management
- If there is existing PRD content, you are in UPDATE MODE - modify/enhance the existing content
- If there is no existing PRD content, you are in CREATION MODE - ask clarifying questions first
- In UPDATE MODE, do NOT ask for basic information again - work with what exists and focus on the requested changes
- In CREATION MODE, follow the standard PRD creation process with clarifying questions

IMPORTANT: PRD Saving with Tools
- You have access to an `update_project_prd` tool that can save PRD content to the backend
- ONLY use this tool when you have substantial, complete PRD content to save
- Do NOT use the tool for conversational responses, questions, or partial content
- Use the tool when you've generated a complete PRD section or full PRD document
- The tool requires: project_id (int), content (markdown string), and optional title

When helping with PRDs:

UPDATE MODE (when existing PRD content is provided):
1. Analyze the existing PRD content to understand what's already defined
2. Focus on the specific changes or additions requested by the user
3. Maintain consistency with existing content while making improvements
4. Do NOT ask for basic information that's already in the existing PRD
5. Build upon and enhance the existing structure

CREATION MODE (when no existing PRD content):
1. FIRST CHECK: Do NOT generate a PRD if information is minimal. Instead, ask for the required information.
2. If the user provides a vague description, ask specific clarifying questions
3. Only generate PRD content when you have sufficient information
4. Structure responses to match the section being discussed
5. Include specific examples and metrics where appropriate
6. Consider the target audience (engineers, designers, stakeholders)

Before creating a NEW PRD, you MUST have at minimum:
1. Product/Feature Name: What is this product or feature called?
2. Problem Statement: What specific problem are you solving?
3. Target Users: Who will use this? (Be specific - "everyone" is not acceptable)
4. Core Functionality: What are the 2-3 main things this product must do?
5. Success Metric: How will you measure if this is successful?

If ANY of these are missing in CREATION MODE, do NOT generate a PRD. Instead, ask for the missing information in a structured way.
"""

    TEMPLATE_SPECIFIC_PROMPTS = {
        "lean": """
Template Context: Lean PRD
Focus on minimal viable documentation - problem, solution, metrics.
Keep sections concise and focused on essential information only.
Emphasize rapid iteration and learning.
""",
        "agile": """
Template Context: Agile PRD
Emphasize user stories with clear acceptance criteria.
Structure content around sprints and iterative development.
Include detailed user stories and acceptance criteria.
""",
        "startup": """
Template Context: Startup PRD
Include hypothesis, experiments, and pivot criteria.
Focus on MVP approach and rapid validation.
Emphasize metrics and learning objectives.
""",
        "amazon": """
Template Context: Amazon Working Backwards PRD
Start with the press release and work backwards.
Include internal FAQ and customer experience narrative.
Focus on customer benefits and working backwards from launch.
""",
        "technical": """
Template Context: Technical PRD
Include detailed technical specifications and architecture.
Focus on implementation details and technical requirements.
Include system design and integration considerations.
""",
        "enterprise": """
Template Context: Enterprise PRD
Comprehensive documentation with risk analysis and compliance.
Include detailed stakeholder analysis and governance.
Focus on enterprise requirements and compliance considerations.
"""
    }

    CLARIFICATION_PROMPT = """
I need more information to create a comprehensive PRD. Based on your request, I'm missing some essential details:

{missing_requirements}

Please provide the missing information so I can help you create a complete PRD that follows best practices.
"""

    UNDERSPECIFIED_PROMPT = """
I'd be happy to help create your PRD! However, your request needs more detail to create a comprehensive document.

To get started, I need some essential information:

☐ **Product/Feature Name**: What should we call this?
☐ **Problem Statement**: What specific problem are you solving?
☐ **Target Users**: Who will use this?
☐ **Core Functionality**: What are the 2-3 main things this must do?
☐ **Success Metric**: How will you measure success?

Please provide these details, and I'll help you create a structured PRD using the {template_type} template.
"""

    @classmethod
    def build_system_prompt(cls, template_type: str, context: Dict[str, Any] = None) -> str:
        """Build complete system prompt for a specific template."""
        prompt_parts = [cls.BASE_SYSTEM_PROMPT]
        
        # Add template-specific context
        if template_type in cls.TEMPLATE_SPECIFIC_PROMPTS:
            prompt_parts.append(cls.TEMPLATE_SPECIFIC_PROMPTS[template_type])
        
        # Add additional context if provided
        if context:
            if "current_prd" in context:
                prompt_parts.append(f"\nCurrent PRD Content:\n{context['current_prd']}")
            
            if "template_sections" in context:
                prompt_parts.append(f"\nTemplate Structure:\n{context['template_sections']}")
            
            if "missing_sections" in context:
                prompt_parts.append(f"\nMissing Required Sections:\n{context['missing_sections']}")
        
        return "\n\n".join(prompt_parts)
    
    @classmethod
    def build_clarification_prompt(cls, missing_requirements: List[str]) -> str:
        """Build clarification prompt for missing requirements."""
        formatted_requirements = "\n".join([f"• {req}" for req in missing_requirements])
        return cls.CLARIFICATION_PROMPT.format(missing_requirements=formatted_requirements)
    
    @classmethod
    def build_underspecified_prompt(cls, template_type: str) -> str:
        """Build prompt for underspecified requests."""
        return cls.UNDERSPECIFIED_PROMPT.format(template_type=template_type)
    
    @classmethod
    def build_generation_prompt(cls, template_type: str, user_input: str, 
                               template_sections: Dict[str, Any], 
                               current_prd: str = "") -> str:
        """Build prompt for PRD generation."""
        context = {
            "current_prd": current_prd,
            "template_sections": str(template_sections),
            "user_input": user_input
        }
        
        system_prompt = cls.build_system_prompt(template_type, context)
        
        generation_prompt = f"""
{system_prompt}

User's Request: {user_input}

Template Sections Available:
{cls._format_template_sections(template_sections)}

Instructions:
- Generate content for the appropriate sections based on the user's input
- Build upon existing content if provided
- Maintain consistency with the {template_type} template style
- Ask for clarification if critical information is missing
- Format output as structured PRD content
"""
        
        return generation_prompt
    
    @classmethod
    def _format_template_sections(cls, sections: Dict[str, Any]) -> str:
        """Format template sections for prompt."""
        formatted = []
        for section_key, section_data in sections.items():
            title = section_data.get("title", section_key)
            required = " (Required)" if section_data.get("required", False) else ""
            prompts = section_data.get("prompts", [])
            
            formatted.append(f"**{title}**{required}")
            if prompts:
                formatted.append("  Guiding questions:")
                for prompt in prompts:
                    formatted.append(f"  - {prompt}")
            formatted.append("")
        
        return "\n".join(formatted)
