"""FastAPI server for AI agents."""

import os
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from pmagents import PRDAgent
from config import AgentConfig

# Initialize FastAPI app
app = FastAPI(
    title="PM Helper AI Agents",
    description="AI agents for PRD creation and product management",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        AgentConfig.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent instance
prd_agent = PRDAgent()

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    template_type: str = "lean"
    project_id: Optional[int] = None
    project_context: Optional[Dict[str, Any]] = None
    chat_history: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    content: str
    type: str
    requires_input: bool = False
    missing_info: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class TemplateInfo(BaseModel):
    name: str
    description: str
    template_type: str
    sections: List[str]
    required_sections: List[str]

class ConversationHistory(BaseModel):
    messages: List[Dict[str, Any]]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ai-agents"}

# Agent endpoints
@app.post("/agents/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """Chat with PRD creation agent."""
    try:
        response = await prd_agent.chat(
            user_message=request.message,
            template_type=request.template_type,
            project_context=request.project_context,
            chat_history=request.chat_history
        )
        
        return ChatResponse(
            content=response["content"],
            type=response.get("type", "response"),
            requires_input=response.get("requires_input", False),
            missing_info=response.get("missing_info"),
            metadata=response.get("metadata")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

@app.get("/agents/templates")
async def get_available_templates():
    """Get list of available PRD templates."""
    try:
        templates = prd_agent.get_available_templates()
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template error: {str(e)}")

@app.get("/agents/templates/{template_type}", response_model=TemplateInfo)
async def get_template_info(template_type: str):
    """Get information about a specific template."""
    try:
        template_info = prd_agent.get_template_info(template_type)
        if not template_info:
            raise HTTPException(status_code=404, detail=f"Template {template_type} not found")
        
        return TemplateInfo(**template_info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template error: {str(e)}")

@app.get("/agents/conversation", response_model=ConversationHistory)
async def get_conversation_history():
    """Get conversation history."""
    try:
        history = prd_agent.get_conversation_history()
        return ConversationHistory(messages=history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History error: {str(e)}")

@app.post("/agents/conversation/clear")
async def clear_conversation():
    """Clear conversation history."""
    try:
        prd_agent.clear_conversation()
        return {"message": "Conversation cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear error: {str(e)}")

# Direct PRD generation endpoint
@app.post("/agents/generate-prd")
async def generate_prd_direct(request: ChatRequest):
    """Direct PRD generation without conversation."""
    try:
        # Clear previous conversation for clean generation
        prd_agent.clear_conversation()
        
        response = await prd_agent.chat(
            user_message=request.message,
            template_type=request.template_type,
            project_context=request.project_context
        )
        
        return ChatResponse(
            content=response["content"],
            type=response.get("type", "prd_content"),
            requires_input=response.get("requires_input", False),
            missing_info=response.get("missing_info"),
            metadata=response.get("metadata")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

# Validation endpoint
@app.post("/agents/validate")
async def validate_prd_input(request: Dict[str, Any]):
    """Validate PRD input for completeness."""
    try:
        user_input = request.get("input", "")
        template_type = request.get("template_type", "lean")
        
        validation_result = prd_agent.validator.validate_user_input(user_input)
        
        return {
            "is_sufficient": validation_result["is_sufficient"],
            "completeness_score": validation_result["completeness_score"],
            "missing_info": validation_result["missing_info"],
            "extracted_info": validation_result["extracted_info"],
            "is_underspecified": prd_agent.validator.is_request_underspecified(user_input)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

# Configuration endpoint
@app.get("/agents/config")
async def get_agent_config():
    """Get agent configuration."""
    try:
        config = AgentConfig.get_agent_config()
        # Remove sensitive information
        config.pop("api_key", None)
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Config error: {str(e)}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "detail": str(exc)}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {"error": "Internal server error", "detail": str(exc)}

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    print("🚀 AI Agents server starting up...")
    print(f"📋 Available templates: {prd_agent.get_available_templates()}")
    print("✅ AI Agents server ready!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("🛑 AI Agents server shutting down...")

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Validate configuration
    try:
        AgentConfig.validate_config()
        print("✅ Configuration validated successfully")
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        exit(1)
    
    # Run server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
