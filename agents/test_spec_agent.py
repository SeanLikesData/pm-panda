"""Test script for Spec Agent functionality."""

import asyncio
import sys
import os

# Add the agents directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pmagents import SpecAgent
from config import AgentConfig

async def test_spec_agent():
    """Test the Spec Agent functionality."""
    print("🧪 Testing Spec Agent...")
    
    try:
        # Initialize the agent
        spec_agent = SpecAgent()
        print("✅ Spec Agent initialized successfully")
        
        # Test available templates
        templates = spec_agent.get_available_templates()
        print(f"📋 Available templates: {templates}")
        
        # Test template info
        for template in templates[:2]:  # Test first 2 templates
            info = spec_agent.get_template_info(template)
            print(f"🔧 Template '{template}': {info.get('name', 'Unknown')}")
        
        # Test basic chat functionality
        print("\n💬 Testing chat functionality...")
        
        # Test project context
        project_context = {
            "project_id": 1,
            "existing_spec": "",
            "has_existing_spec": False
        }
        
        # Test message
        test_message = "Create an API specification for a user management system with authentication, user CRUD operations, and role-based access control."
        
        response = await spec_agent.chat(
            user_message=test_message,
            template_type="api",
            project_context=project_context
        )
        
        print(f"🤖 Agent Response Type: {response.get('type', 'unknown')}")
        print(f"📝 Response Length: {len(response.get('content', ''))}")
        print(f"🔧 Template Used: {response.get('metadata', {}).get('template_type', 'unknown')}")
        
        # Print first 200 characters of response
        content = response.get('content', '')
        if content:
            print(f"📄 Response Preview: {content[:200]}...")
        
        print("\n✅ Spec Agent test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Set up basic environment for testing
    os.environ.setdefault('OPENAI_API_KEY', 'test-key')
    os.environ.setdefault('BACKEND_URL', 'http://localhost:4000')
    
    asyncio.run(test_spec_agent())
