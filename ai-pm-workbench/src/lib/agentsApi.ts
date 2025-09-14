/**
 * API client for AI agents service
 */

import { api } from './api';

export interface ChatRequest {
  message: string;
  template_type?: string;
  project_id?: number;
  project_context?: Record<string, any>;
  chat_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

export interface ChatResponse {
  content: string;
  type: string;
  requires_input?: boolean;
  missing_info?: string[];
  metadata?: Record<string, any>;
}

export interface TemplateInfo {
  name: string;
  description: string;
  template_type: string;
  sections: string[];
  required_sections: string[];
}

export interface ConversationHistory {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

export interface ValidationResult {
  is_sufficient: boolean;
  completeness_score: number;
  missing_info: string[];
  extracted_info: Record<string, string>;
  is_underspecified: boolean;
}

class AgentsApi {
  private baseUrl = 'http://localhost:8000';

  /**
   * Chat with the PRD creation agent
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/agents/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Agent chat failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate PRD directly without conversation
   */
  async generatePRD(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/agents/generate-prd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`PRD generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<{ templates: string[] }> {
    const response = await fetch(`${this.baseUrl}/agents/templates`);

    if (!response.ok) {
      throw new Error(`Failed to get templates: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get template information
   */
  async getTemplateInfo(templateType: string): Promise<TemplateInfo> {
    const response = await fetch(`${this.baseUrl}/agents/templates/${templateType}`);

    if (!response.ok) {
      throw new Error(`Failed to get template info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<ConversationHistory> {
    const response = await fetch(`${this.baseUrl}/agents/conversation`);

    if (!response.ok) {
      throw new Error(`Failed to get conversation history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear conversation history
   */
  async clearConversation(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/agents/conversation/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Validate PRD input
   */
  async validateInput(input: string, templateType: string = 'lean'): Promise<ValidationResult> {
    const response = await fetch(`${this.baseUrl}/agents/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        template_type: templateType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get agent configuration
   */
  async getConfig(): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/agents/config`);

    if (!response.ok) {
      throw new Error(`Failed to get config: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const agentsApi = new AgentsApi();
