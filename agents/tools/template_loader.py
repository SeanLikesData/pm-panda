"""Template loading utilities for PRD generation."""

import json
import os
from typing import Dict, Any, List, Optional
from pathlib import Path

class TemplateLoader:
    """Loads and manages PRD and Spec templates."""
    
    def __init__(self, templates_path: str = "../backend/templates"):
        self.templates_path = Path(templates_path)
        self._templates_cache: Dict[str, Dict[str, Any]] = {}
        self._spec_templates_cache: Dict[str, Dict[str, Any]] = {}
    
    def load_template(self, template_type: str) -> Optional[Dict[str, Any]]:
        """Load a specific template by type."""
        if template_type in self._templates_cache:
            return self._templates_cache[template_type]
        
        template_file = self.templates_path / f"{template_type}-prd.json"
        
        if not template_file.exists():
            return None
        
        try:
            with open(template_file, 'r', encoding='utf-8') as f:
                template = json.load(f)
            
            self._templates_cache[template_type] = template
            return template
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading template {template_type}: {e}")
            return None
    
    def get_available_templates(self) -> List[str]:
        """Get list of available template types."""
        if not self.templates_path.exists():
            return []
        
        templates = []
        for file in self.templates_path.glob("*-prd.json"):
            template_type = file.stem.replace("-prd", "")
            templates.append(template_type)
        
        return sorted(templates)
    
    def get_template_sections(self, template_type: str) -> Dict[str, Any]:
        """Get sections for a specific template."""
        template = self.load_template(template_type)
        if not template:
            return {}
        
        return template.get("sections", {})
    
    def get_required_sections(self, template_type: str) -> List[str]:
        """Get required sections for a template."""
        sections = self.get_template_sections(template_type)
        required = []
        
        for section_key, section_data in sections.items():
            if section_data.get("required", False):
                required.append(section_key)
        
        return required
    
    def get_section_prompts(self, template_type: str, section_key: str) -> List[str]:
        """Get prompts for a specific section."""
        sections = self.get_template_sections(template_type)
        section = sections.get(section_key, {})
        return section.get("prompts", [])
    
    def validate_template_data(self, template_type: str, data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Validate PRD data against template requirements."""
        template = self.load_template(template_type)
        if not template:
            return {"errors": [f"Template {template_type} not found"]}
        
        sections = template.get("sections", {})
        errors = []
        missing_required = []
        
        # Check required sections
        for section_key, section_data in sections.items():
            if section_data.get("required", False):
                if section_key not in data or not data[section_key].strip():
                    missing_required.append(section_data.get("title", section_key))
        
        if missing_required:
            errors.append(f"Missing required sections: {', '.join(missing_required)}")
        
        return {
            "errors": errors,
            "missing_required": missing_required,
            "is_valid": len(errors) == 0
        }
    
    def get_template_info(self, template_type: str) -> Dict[str, Any]:
        """Get comprehensive template information."""
        template = self.load_template(template_type)
        if not template:
            return {}
        
        return {
            "name": template.get("name", ""),
            "description": template.get("description", ""),
            "template_type": template.get("templateType", template_type),
            "sections": list(template.get("sections", {}).keys()),
            "required_sections": self.get_required_sections(template_type)
        }
    
    # Spec-specific methods
    def load_spec_template(self, template_type: str) -> Optional[Dict[str, Any]]:
        """Load a specific spec template by type."""
        if template_type in self._spec_templates_cache:
            return self._spec_templates_cache[template_type]
        
        template_file = self.templates_path / f"{template_type}-spec.json"
        
        if not template_file.exists():
            # Return a default spec template structure if file doesn't exist
            return self._get_default_spec_template(template_type)
        
        try:
            with open(template_file, 'r', encoding='utf-8') as f:
                template = json.load(f)
            
            self._spec_templates_cache[template_type] = template
            return template
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading spec template {template_type}: {e}")
            return self._get_default_spec_template(template_type)
    
    def _get_default_spec_template(self, template_type: str) -> Dict[str, Any]:
        """Get default spec template structure for a given type."""
        default_templates = {
            "api": {
                "name": "API Specification",
                "description": "REST/GraphQL API specification template",
                "templateType": "api",
                "sections": {
                    "overview": {
                        "title": "API Overview",
                        "required": True,
                        "prompts": [
                            "What is the purpose of this API?",
                            "Who are the intended consumers?",
                            "What are the main use cases?"
                        ]
                    },
                    "authentication": {
                        "title": "Authentication & Authorization",
                        "required": True,
                        "prompts": [
                            "What authentication method will be used?",
                            "What are the authorization requirements?",
                            "How are API keys/tokens managed?"
                        ]
                    },
                    "endpoints": {
                        "title": "API Endpoints",
                        "required": True,
                        "prompts": [
                            "What are the main endpoints?",
                            "What are the request/response schemas?",
                            "What are the HTTP methods and status codes?"
                        ]
                    },
                    "error_handling": {
                        "title": "Error Handling",
                        "required": True,
                        "prompts": [
                            "How are errors formatted and returned?",
                            "What are the common error scenarios?",
                            "How should clients handle different error types?"
                        ]
                    },
                    "rate_limiting": {
                        "title": "Rate Limiting & Throttling",
                        "required": False,
                        "prompts": [
                            "What are the rate limits?",
                            "How is throttling implemented?",
                            "How are limits communicated to clients?"
                        ]
                    }
                }
            },
            "system": {
                "name": "System Architecture Specification",
                "description": "High-level system architecture specification",
                "templateType": "system",
                "sections": {
                    "overview": {
                        "title": "System Overview",
                        "required": True,
                        "prompts": [
                            "What is the system's primary purpose?",
                            "What are the key components?",
                            "What are the main user flows?"
                        ]
                    },
                    "architecture": {
                        "title": "Architecture Design",
                        "required": True,
                        "prompts": [
                            "What is the overall architecture pattern?",
                            "How do components communicate?",
                            "What are the system boundaries?"
                        ]
                    },
                    "data_flow": {
                        "title": "Data Flow",
                        "required": True,
                        "prompts": [
                            "How does data flow through the system?",
                            "What are the data transformation points?",
                            "Where is data stored and cached?"
                        ]
                    },
                    "scalability": {
                        "title": "Scalability & Performance",
                        "required": True,
                        "prompts": [
                            "What are the expected load requirements?",
                            "How will the system scale?",
                            "What are the performance targets?"
                        ]
                    },
                    "security": {
                        "title": "Security Considerations",
                        "required": True,
                        "prompts": [
                            "What are the security requirements?",
                            "How is data protected?",
                            "What are the authentication/authorization mechanisms?"
                        ]
                    }
                }
            },
            "database": {
                "name": "Database Schema Specification",
                "description": "Database design and schema specification",
                "templateType": "database",
                "sections": {
                    "overview": {
                        "title": "Database Overview",
                        "required": True,
                        "prompts": [
                            "What type of database is being used?",
                            "What is the primary use case?",
                            "What are the data requirements?"
                        ]
                    },
                    "schema": {
                        "title": "Schema Design",
                        "required": True,
                        "prompts": [
                            "What are the main entities and relationships?",
                            "What are the table structures?",
                            "What are the primary and foreign keys?"
                        ]
                    },
                    "indexes": {
                        "title": "Indexes & Performance",
                        "required": True,
                        "prompts": [
                            "What indexes are needed for performance?",
                            "What are the common query patterns?",
                            "How will performance be optimized?"
                        ]
                    },
                    "constraints": {
                        "title": "Data Integrity & Constraints",
                        "required": True,
                        "prompts": [
                            "What data validation rules are needed?",
                            "What are the business constraints?",
                            "How is data consistency maintained?"
                        ]
                    }
                }
            },
            "integration": {
                "name": "Integration Specification",
                "description": "System integration and external service specification",
                "templateType": "integration",
                "sections": {
                    "overview": {
                        "title": "Integration Overview",
                        "required": True,
                        "prompts": [
                            "What systems are being integrated?",
                            "What is the integration purpose?",
                            "What are the data exchange requirements?"
                        ]
                    },
                    "protocols": {
                        "title": "Communication Protocols",
                        "required": True,
                        "prompts": [
                            "What communication protocols are used?",
                            "How is data formatted and transmitted?",
                            "What are the message schemas?"
                        ]
                    },
                    "error_handling": {
                        "title": "Error Handling & Retry Logic",
                        "required": True,
                        "prompts": [
                            "How are integration failures handled?",
                            "What is the retry strategy?",
                            "How are errors logged and monitored?"
                        ]
                    },
                    "monitoring": {
                        "title": "Monitoring & Observability",
                        "required": True,
                        "prompts": [
                            "How is integration health monitored?",
                            "What metrics are tracked?",
                            "How are issues detected and alerted?"
                        ]
                    }
                }
            },
            "microservice": {
                "name": "Microservice Specification",
                "description": "Microservice design and implementation specification",
                "templateType": "microservice",
                "sections": {
                    "overview": {
                        "title": "Service Overview",
                        "required": True,
                        "prompts": [
                            "What is the service's responsibility?",
                            "What business capability does it provide?",
                            "How does it fit in the overall architecture?"
                        ]
                    },
                    "api_contract": {
                        "title": "API Contract",
                        "required": True,
                        "prompts": [
                            "What APIs does the service expose?",
                            "What are the request/response formats?",
                            "What are the service dependencies?"
                        ]
                    },
                    "data_management": {
                        "title": "Data Management",
                        "required": True,
                        "prompts": [
                            "What data does the service own?",
                            "How is data consistency maintained?",
                            "What is the data storage strategy?"
                        ]
                    },
                    "deployment": {
                        "title": "Deployment & Operations",
                        "required": True,
                        "prompts": [
                            "How is the service deployed?",
                            "What are the operational requirements?",
                            "How is the service monitored and maintained?"
                        ]
                    }
                }
            }
        }
        
        return default_templates.get(template_type, default_templates["api"])
    
    def get_available_spec_templates(self) -> List[str]:
        """Get list of available spec template types."""
        # Return both file-based and default templates
        file_templates = []
        if self.templates_path.exists():
            for file in self.templates_path.glob("*-spec.json"):
                template_type = file.stem.replace("-spec", "")
                file_templates.append(template_type)
        
        # Add default template types
        default_types = ["api", "system", "database", "integration", "microservice"]
        
        # Combine and deduplicate
        all_templates = list(set(file_templates + default_types))
        return sorted(all_templates)
    
    def get_spec_template_sections(self, template_type: str) -> Dict[str, Any]:
        """Get sections for a specific spec template."""
        template = self.load_spec_template(template_type)
        if not template:
            return {}
        
        return template.get("sections", {})
    
    def get_spec_required_sections(self, template_type: str) -> List[str]:
        """Get required sections for a spec template."""
        sections = self.get_spec_template_sections(template_type)
        required = []
        
        for section_key, section_data in sections.items():
            if section_data.get("required", False):
                required.append(section_key)
        
        return required
    
    def get_spec_section_prompts(self, template_type: str, section_key: str) -> List[str]:
        """Get prompts for a specific spec section."""
        sections = self.get_spec_template_sections(template_type)
        section = sections.get(section_key, {})
        return section.get("prompts", [])
    
    def get_spec_template_info(self, template_type: str) -> Dict[str, Any]:
        """Get comprehensive spec template information."""
        template = self.load_spec_template(template_type)
        if not template:
            return {}
        
        return {
            "name": template.get("name", ""),
            "description": template.get("description", ""),
            "template_type": template.get("templateType", template_type),
            "sections": list(template.get("sections", {}).keys()),
            "required_sections": self.get_spec_required_sections(template_type)
        }
