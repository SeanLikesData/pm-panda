import { useState, useEffect } from "react";
import { Send, Bot, User, Sparkles, Settings, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("lean");
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<"online" | "offline" | "checking">("checking");
  const [isSavingPRD, setIsSavingPRD] = useState(false);
  const [existingPRD, setExistingPRD] = useState<string>("");

  // Initialize chat and check agent status
  useEffect(() => {
    initializeChat();
    checkAgentStatus();
    loadAvailableTemplates();
    if (projectId) {
      loadExistingPRD();
    }
  }, [projectId]);

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI Product Manager assistant. I can help you create comprehensive PRDs using various templates. What product or feature would you like to work on today?",
      timestamp: new Date(),
      type: "welcome",
    };
    setMessages([welcomeMessage]);
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

  const loadAvailableTemplates = async () => {
    try {
      const { templates } = await agentsApi.getTemplates();
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

    try {
      const response: ChatResponse = await agentsApi.chat({
        message: inputValue,
        template_type: selectedTemplate,
        project_id: projectId ? parseInt(projectId) : undefined,
        project_context: {
          existing_prd: existingPRD,
          has_existing_prd: existingPRD.length > 0,
          project_id: projectId ? parseInt(projectId) : undefined,
        },
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

      // Check if the agent used tools to update PRD (no automatic saving)
      if (response.metadata?.tool_calls_made) {
        // Agent used tools to save PRD, refresh our local state
        await loadExistingPRD();
        toast({
          title: "PRD Updated",
          description: "The AI agent has updated your PRD.",
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
      await agentsApi.clearConversation();
      initializeChat();
      toast({
        title: "Conversation Cleared",
        description: "Chat history has been reset",
      });
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  };

  const savePRDToBackend = async (content: string, templateType: string) => {
    if (!projectId) return;

    setIsSavingPRD(true);
    try {
      // Always try to update first if we have existing PRD, otherwise create
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

      // Update the existing PRD state so future requests are in update mode
      setExistingPRD(content);

      toast({
        title: "PRD Saved",
        description: "Your PRD has been automatically saved to the project.",
      });
    } catch (error) {
      console.error("Failed to save PRD:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save PRD to backend. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPRD(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-96 bg-gradient-card border-l border-border flex flex-col h-screen max-h-screen sticky top-0">
      {/* Chat header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <div className="flex items-center gap-1">
                <Badge
                  variant={agentStatus === "online" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {agentStatus}
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
          <label className="text-xs font-medium text-muted-foreground">Template</label>
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
      <ScrollArea className="flex-1 p-4">
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
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI teammate..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
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
