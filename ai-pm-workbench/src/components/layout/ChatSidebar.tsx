import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, Settings, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { agentsApi, type ChatResponse } from "@/lib/agentsApi";
import { prdApi } from "@/lib/prdApi";
import { specApi } from "@/lib/specApi";
import { chatApi } from "@/lib/chatApi";
import { useParams, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { refreshProjectData } from "@/lib/projectDataRefresh";
import { useProjectStore } from "@/lib/projectStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: string;
  requires_input?: boolean;
  missing_info?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export function ChatSidebar() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Determine current context from URL hash or default to PRD
  const getCurrentContext = (): "prd" | "spec" => {
    const hash = location.hash;
    if (hash.includes("spec")) return "spec";
    return "prd";
  };

  const [currentContext, setCurrentContext] = useState<"prd" | "spec">(getCurrentContext());
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("lean");
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<"online" | "offline" | "checking">("checking");
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [existingPRD, setExistingPRD] = useState<string>("");
  const [existingSpec, setExistingSpec] = useState<string>("");

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // Update context when location changes
  useEffect(() => {
    const newContext = getCurrentContext();
    if (newContext !== currentContext) {
      setCurrentContext(newContext);
      // Clear messages when switching context
      setMessages([]);
      // Load templates for new context
      loadAvailableTemplates(newContext);
      // Set appropriate default template
      if (newContext === "spec") {
        setSelectedTemplate("api");
      } else {
        setSelectedTemplate("lean");
      }
    }
  }, [location.hash, currentContext]);

  // Initialize chat and check agent status
  useEffect(() => {
    initializeChat();
    checkAgentStatus();
    loadAvailableTemplates(currentContext);
    if (projectId) {
      loadExistingPRD();
      loadExistingSpec();
    }
  }, [projectId, currentContext]);

  // Auto-scroll when messages change (but not during initial history load)
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoadingHistory]);

  const initializeChat = async () => {
    if (!projectId) {
      // No project selected, show welcome message
      const welcomeContent =
        currentContext === "spec"
          ? "Hi! I'm your AI Technical Architect assistant. I can help you create comprehensive technical specifications using various templates. What system or feature would you like to design today?"
          : "Hi! I'm your AI Product Manager assistant. I can help you create comprehensive PRDs using various templates. What product or feature would you like to work on today?";

      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: welcomeContent,
        timestamp: new Date(),
        type: "welcome",
      };
      setMessages([welcomeMessage]);
      return;
    }

    // Load chat history from backend
    setIsLoadingHistory(true);
    try {
      const { messages: chatHistory } = await chatApi.getRecentMessages(parseInt(projectId), 100);

      if (chatHistory.length === 0) {
        // No existing chat history, show welcome message
        const welcomeContent =
          currentContext === "spec"
            ? "Hi! I'm your AI Technical Architect assistant. I can help you create comprehensive technical specifications using various templates. What system or feature would you like to design today?"
            : "Hi! I'm your AI Product Manager assistant. I can help you create comprehensive PRDs using various templates. What product or feature would you like to work on today?";

        const welcomeMessage: Message = {
          id: "welcome",
          role: "assistant",
          content: welcomeContent,
          timestamp: new Date(),
          type: "welcome",
        };
        setMessages([welcomeMessage]);

        // Save welcome message to backend
        await chatApi.createMessage(
          parseInt(projectId),
          chatApi.convertToApiFormat(welcomeMessage)
        );
      } else {
        // Convert API messages to frontend format
        const convertedMessages = chatHistory.map((msg) => chatApi.convertFromApiFormat(msg));
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Fallback to welcome message
      const welcomeContent =
        currentContext === "spec"
          ? "Hi! I'm your AI Technical Architect assistant. I can help you create comprehensive technical specifications using various templates. What system or feature would you like to design today?"
          : "Hi! I'm your AI Product Manager assistant. I can help you create comprehensive PRDs using various templates. What product or feature would you like to work on today?";

      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: welcomeContent,
        timestamp: new Date(),
        type: "welcome",
      };
      setMessages([welcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessageToBackend = async (message: Message) => {
    if (!projectId) return;

    try {
      await chatApi.createMessage(parseInt(projectId), chatApi.convertToApiFormat(message));
    } catch (error) {
      console.error("Failed to save message to backend:", error);
      // Don't show error to user as this is background operation
    }
  };

  const checkAgentStatus = async () => {
    try {
      await agentsApi.healthCheck();
      setAgentStatus("online");
    } catch (error) {
      setAgentStatus("offline");
      toast({
        title: "AI Agent Offline",
        description:
          "The AI agent service is not available. Please check if the agents server is running.",
        variant: "destructive",
      });
    }
  };

  const loadAvailableTemplates = async (agentType: "prd" | "spec" = currentContext) => {
    try {
      const { templates } = await agentsApi.getTemplates(agentType);
      setAvailableTemplates(templates);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const loadExistingPRD = async () => {
    if (!projectId) return;

    try {
      const prd = await prdApi.get(parseInt(projectId));
      setExistingPRD(prd.content || "");
    } catch (error) {
      // PRD doesn't exist yet, which is fine
      setExistingPRD("");
    }
  };

  const loadExistingSpec = async () => {
    if (!projectId) return;

    try {
      const spec = await specApi.get(parseInt(projectId));
      setExistingSpec(spec.content || "");
    } catch (error) {
      // Spec doesn't exist yet, which is fine
      setExistingSpec("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || agentStatus !== "online") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Save user message to backend
    await saveMessageToBackend(userMessage);

    try {
      // Prepare chat history for the agent (exclude the current user message)
      const chatHistoryForAgent = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        metadata: msg.metadata,
      }));

      const response: ChatResponse = await agentsApi.chat({
        message: inputValue,
        template_type: selectedTemplate,
        agent_type: currentContext,
        project_id: projectId ? parseInt(projectId) : undefined,
        project_context:
          currentContext === "spec"
            ? {
                existing_spec: existingSpec,
                has_existing_spec: existingSpec.length > 0,
                project_id: projectId ? parseInt(projectId) : undefined,
              }
            : {
                existing_prd: existingPRD,
                has_existing_prd: existingPRD.length > 0,
                project_id: projectId ? parseInt(projectId) : undefined,
              },
        chat_history: chatHistoryForAgent,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        type: response.type,
        requires_input: response.requires_input,
        missing_info: response.missing_info,
        metadata: response.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to backend
      await saveMessageToBackend(assistantMessage);

      // Check if the agent used tools to update project data
      console.log("Agent response metadata:", response.metadata);
      try {
        // Use the comprehensive refresh system to update all project data
        const refreshResult = await refreshProjectData(parseInt(projectId));

        // Update local document state for chat context
        if (refreshResult.prd) {
          setExistingPRD(refreshResult.prd.content || "");
        }
        if (refreshResult.spec) {
          setExistingSpec(refreshResult.spec.content || "");
        }

        // Show success toast
        toast({
          title: "Project Updated",
          description: "The AI agent has updated your project data.",
        });

        console.log("Project data refresh completed:", refreshResult);
      } catch (error) {
        console.error("Failed to refresh project data:", error);
        toast({
          title: "Update Complete",
          description:
            "The AI agent has updated your project. Please refresh if you don't see changes.",
          variant: "default",
        });
      }

      // Show toast for clarification requests
      if (response.type === "clarification" && response.missing_info?.length) {
        toast({
          title: "More Information Needed",
          description: `Please provide: ${response.missing_info.join(", ")}`,
        });
      }
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I encountered an error while processing your request. Please try again or check if the AI agents service is running.",
        timestamp: new Date(),
        type: "error",
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Chat Error",
        description: "Failed to get response from AI agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = async () => {
    try {
      // Clear conversation in agents for current context
      await agentsApi.clearConversation(currentContext);

      // Clear chat history in backend if we have a project
      if (projectId) {
        await chatApi.clearMessages(parseInt(projectId));
      }

      // Reinitialize chat (will create new welcome message)
      await initializeChat();

      toast({
        title: "Conversation Cleared",
        description: `${currentContext.toUpperCase()} chat history has been reset`,
      });
    } catch (error) {
      console.error("Failed to clear conversation:", error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear conversation history",
        variant: "destructive",
      });
    }
  };

  const saveDocumentToBackend = async (content: string, templateType: string) => {
    if (!projectId) return;

    setIsSavingDocument(true);
    try {
      if (currentContext === "spec") {
        // Handle Spec saving
        if (existingSpec) {
          await specApi.update(parseInt(projectId), {
            content,
            status: "draft" as const,
          });
        } else {
          await specApi.create(parseInt(projectId), {
            title: `Spec - ${
              templateType.charAt(0).toUpperCase() + templateType.slice(1)
            } Template`,
            content,
            status: "draft" as const,
          });
        }
        setExistingSpec(content);

        toast({
          title: "Spec Saved",
          description: "Your technical specification has been automatically saved to the project.",
        });
      } else {
        // Handle PRD saving
        if (existingPRD) {
          await prdApi.update(parseInt(projectId), {
            content,
            status: "draft" as const,
          });
        } else {
          await prdApi.create(parseInt(projectId), {
            title: `PRD - ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template`,
            content,
            status: "draft" as const,
          });
        }
        setExistingPRD(content);

        toast({
          title: "PRD Saved",
          description: "Your PRD has been automatically saved to the project.",
        });
      }
    } catch (error) {
      console.error(`Failed to save ${currentContext}:`, error);
      toast({
        title: "Save Failed",
        description: `Failed to save ${currentContext.toUpperCase()} to backend. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-[460px] bg-gradient-card border-l border-border flex flex-col h-screen max-h-screen sticky top-0">
      {/* Chat header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                AI {currentContext === "spec" ? "Architect" : "PM"} Assistant
              </h3>
              <div className="flex items-center gap-1">
                <Badge
                  variant={agentStatus === "online" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {agentStatus}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentContext.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={checkAgentStatus}
              disabled={agentStatus === "checking"}
            >
              <RefreshCw className={cn("w-3 h-3", agentStatus === "checking" && "animate-spin")} />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearConversation}>
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Template selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {currentContext === "spec" ? "Spec Template" : "PRD Template"}
          </label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((template) => (
                <SelectItem key={template} value={template} className="text-xs">
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="w-7 h-7 border border-border/50">
                <AvatarImage />
                <AvatarFallback>
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "flex-1 space-y-1",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom styling for markdown elements
                          h1: ({ children }) => (
                            <h1 className="text-base font-semibold mb-2 text-foreground">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm font-semibold mb-2 text-foreground">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-medium mb-1 text-foreground">{children}</h3>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0 text-foreground">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm text-foreground">{children}</li>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono text-foreground">
                                {children}
                              </code>
                            ) : (
                              <code className={`${className} text-foreground`}>{children}</code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="bg-background/50 p-2 rounded text-xs overflow-x-auto mb-2 text-foreground">
                              {children}
                            </pre>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-border pl-3 italic mb-2 text-foreground">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* AI thinking loader */}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-7 h-7 border border-border/50">
                <AvatarImage />
                <AvatarFallback>
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1 items-start">
                <div className="rounded-lg px-3 py-2 text-sm max-w-[85%] bg-muted text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>AI is thinking</span>
                    <div className="flex gap-1">
                      <div
                        className="w-1 h-1 bg-current rounded-full animate-pulse"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-current rounded-full animate-pulse"
                        style={{ animationDelay: "200ms" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-current rounded-full animate-pulse"
                        style={{ animationDelay: "400ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder={`Ask your AI ${
              currentContext === "spec" ? "architect" : "teammate"
            }... (Shift+Enter for new line, Enter to send)`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
