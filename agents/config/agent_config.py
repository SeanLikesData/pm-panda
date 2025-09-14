"""Agent configuration settings."""

import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class AgentConfig:
    """Configuration for AI agents."""
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    # Agent Configuration
    AGENT_NAME = os.getenv("AGENT_NAME", "PRD_Assistant")
    AGENT_DESCRIPTION = os.getenv("AGENT_DESCRIPTION", "AI Product Manager Assistant for PRD Creation")
    
    # Backend Integration
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Template Configuration
    TEMPLATES_PATH = "../backend_m/templates"
    
    # Agent Behavior
    MAX_CLARIFICATION_ROUNDS = 3
    TEMPERATURE = 0.7
    MAX_TOKENS = 2000
    
    # Required PRD Information
    REQUIRED_PRD_FIELDS = [
        "product_name",
        "problem_statement", 
        "target_users",
        "core_functionality",
        "success_metrics"
    ]
    
    @classmethod
    def get_agent_config(cls) -> Dict[str, Any]:
        """Get agent configuration as dictionary."""
        return {
            "name": cls.AGENT_NAME,
            "description": cls.AGENT_DESCRIPTION,
            "model": cls.OPENAI_MODEL,
            "temperature": cls.TEMPERATURE,
            "max_tokens": cls.MAX_TOKENS,
            "required_fields": cls.REQUIRED_PRD_FIELDS
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate that required configuration is present."""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required")
        return True
