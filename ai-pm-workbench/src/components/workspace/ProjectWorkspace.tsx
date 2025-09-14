import { useState, useEffect } from "react";
import { FileText, Code, Eye, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useToast } from "@/hooks/use-toast";
import { projectApi } from "@/lib/projectApi";
import { prdApi } from "@/lib/prdApi";
import { specApi } from "@/lib/specApi";
import { useProjectStore } from "@/lib/projectStore";
import type { BackendProject, BackendPRD, BackendSpec, DocStatus } from "@/lib/types";
import { projectEventBus, type ProjectUpdateEvent } from "@/lib/projectEventBus";

export function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize active tab from URL hash or default to PRD
  const getInitialTab = () => {
    const hash = location.hash;
    if (hash === "#spec") return "spec";
    return "prd";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [viewMode, setViewMode] = useState<{ prd: "edit" | "preview"; spec: "edit" | "preview" }>({
    prd: "preview",
    spec: "preview",
  });

  const { toast } = useToast();
  const updateProject = useProjectStore((state) => state.updateProject);

  // State
  const [project, setProject] = useState<BackendProject | null>(null);
  const [prd, setPrd] = useState<BackendPRD | null>(null);
  const [spec, setSpec] = useState<BackendSpec | null>(null);
  const [loading, setLoading] = useState(true);

  // Local editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");

  const [content, setContent] = useState({
    prd: { title: "", content: "", status: "draft" as DocStatus },
    spec: { title: "", content: "", technical_details: "", status: "draft" as DocStatus },
  });

  // Update tab when URL hash changes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.hash]);

  // Load project data
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      setLoading(true);

      // Reset all content state when switching projects
      setContent({
        prd: { title: "", content: "", status: "draft" as DocStatus },
        spec: { title: "", content: "", technical_details: "", status: "draft" as DocStatus },
      });
      setPrd(null);
      setSpec(null);

      try {
        const projectData = await projectApi.getOne(Number(projectId));
        setProject(projectData);
        setLocalTitle(projectData.name);
        setLocalDescription(projectData.description || "");

        // Try to load PRD
        try {
          const prdData = await prdApi.get(Number(projectId));
          console.log("PRD API response:", prdData);

          if (prdData) {
            setPrd(prdData);
            setContent((prev) => ({
              ...prev,
              prd: {
                title: prdData.title,
                content: prdData.content || "",
                status: prdData.status,
              },
            }));
          } else {
            // Handle 304 response or empty response
            console.log("PRD data is undefined (likely 304 response) - keeping existing state");
            setPrd(null);
          }
        } catch (error) {
          console.error("Error loading PRD:", error);
          // PRD doesn't exist yet - content already reset above
          setPrd(null);
        }

        // Try to load Spec
        try {
          const specData = await specApi.get(Number(projectId));
          console.log("Spec API response:", specData);

          if (specData) {
            setSpec(specData);
            setContent((prev) => ({
              ...prev,
              spec: {
                title: specData.title,
                content: specData.content || "",
                technical_details: specData.technical_details || "",
                status: specData.status,
              },
            }));
          } else {
            // Handle 304 response or empty response
            console.log("Spec data is undefined (likely 304 response) - keeping existing state");
            setSpec(null);
          }
        } catch (error) {
          console.error("Error loading Spec:", error);
          // Spec doesn't exist yet - content already reset above
          setSpec(null);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, toast]);

  // Listen for project updates from AI agent and other sources
  useEffect(() => {
    if (!projectId) return;

    const handleProjectUpdate = (event: ProjectUpdateEvent) => {
      // Only handle updates for the current project
      if (event.projectId !== Number(projectId)) return;

      console.log("ProjectWorkspace received update event:", event);

      // Handle different types of updates
      if (event.updateType === "all" || event.updateType === "project") {
        // Update project data if provided
        if (event.data?.project) {
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  name: event.data.project!.name,
                  description: event.data.project!.description || null,
                }
              : null
          );
          setLocalTitle(event.data.project.name);
          setLocalDescription(event.data.project.description || "");
        }
      }

      if (event.updateType === "all" || event.updateType === "prd") {
        // Update PRD data if provided
        if (event.data?.prd) {
          const updatedPRD: BackendPRD = {
            id: event.data.prd.id || 0,
            project_id: event.projectId,
            title: event.data.prd.title,
            content: event.data.prd.content,
            status: event.data.prd.status as DocStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setPrd(updatedPRD);
          setContent((prev) => ({
            ...prev,
            prd: {
              title: event.data.prd!.title,
              content: event.data.prd!.content,
              status: event.data.prd!.status as DocStatus,
            },
          }));

          // Auto-switch to PRD tab if update came from AI agent
          if (event.source === "ai-agent" && activeTab !== "prd") {
            setActiveTab("prd");
          }
        }
      }

      if (event.updateType === "all" || event.updateType === "spec") {
        // Update Spec data if provided
        if (event.data?.spec) {
          const updatedSpec: BackendSpec = {
            id: event.data.spec.id || 0,
            project_id: event.projectId,
            title: event.data.spec.title,
            content: event.data.spec.content,
            technical_details: event.data.spec.technical_details || null,
            status: event.data.spec.status as DocStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setSpec(updatedSpec);
          setContent((prev) => ({
            ...prev,
            spec: {
              title: event.data.spec!.title,
              content: event.data.spec!.content,
              technical_details: event.data.spec!.technical_details || "",
              status: event.data.spec!.status as DocStatus,
            },
          }));
        }
      }

      // Show notification if update came from AI agent
      if (event.source === "ai-agent") {
        const updateTypes = [];
        if (event.data?.project) updateTypes.push("project");
        if (event.data?.prd) updateTypes.push("PRD");
        if (event.data?.spec) updateTypes.push("spec");

        if (updateTypes.length > 0) {
          toast({
            title: "Updated by AI",
            description: `Your ${updateTypes.join(", ")} has been updated by the AI assistant.`,
            duration: 3000,
          });
        }
      }
    };

    const unsubscribe = projectEventBus.subscribe(handleProjectUpdate);

    return () => {
      unsubscribe();
    };
  }, [projectId, activeTab, toast]);

  const saveProject = async () => {
    if (!project || !localTitle.trim()) return;

    try {
      // Use the store method to update both database and store
      const updated = await updateProject(project.id, {
        name: localTitle.trim(),
        description: localDescription.trim() || null,
      });

      if (updated) {
        setProject(updated);
        setEditingTitle(false);
        setEditingDescription(false);
        toast({
          title: "Project updated",
          description: "Project details have been saved successfully.",
        });
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const savePRD = async () => {
    if (!project) return;

    try {
      if (prd) {
        // Update existing PRD
        const updated = await prdApi.update(project.id, {
          title: content.prd.title,
          content: content.prd.content || null,
          status: content.prd.status,
        });
        setPrd(updated);
      } else {
        // Create new PRD
        const created = await prdApi.create(project.id, {
          title: content.prd.title || `PRD for ${project.name}`,
          content: content.prd.content || null,
          status: content.prd.status,
        });
        setPrd(created);
        setContent((prev) => ({
          ...prev,
          prd: { ...prev.prd, title: created.title },
        }));
      }

      toast({
        title: "PRD saved",
        description: "PRD has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save PRD",
        variant: "destructive",
      });
    }
  };

  const saveSpec = async () => {
    if (!project) return;

    try {
      if (spec) {
        // Update existing Spec
        const updated = await specApi.update(project.id, {
          title: content.spec.title,
          content: content.spec.content || null,
          technical_details: content.spec.technical_details || null,
          status: content.spec.status,
        });
        setSpec(updated);
      } else {
        // Create new Spec
        const created = await specApi.create(project.id, {
          title: content.spec.title || `Spec for ${project.name}`,
          content: content.spec.content || null,
          technical_details: content.spec.technical_details || null,
          status: content.spec.status,
        });
        setSpec(created);
        setContent((prev) => ({
          ...prev,
          spec: { ...prev.spec, title: created.title },
        }));
      }

      toast({
        title: "Spec saved",
        description: "Spec has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save spec",
        variant: "destructive",
      });
    }
  };

  const renderContent = (type: "prd" | "spec") => {
    const currentViewMode = viewMode[type];
    const contentData = content[type];

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold capitalize">{type}</h3>
            <div className="flex items-center gap-2">
              <Input
                value={contentData.title}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [type]: { ...prev[type], title: e.target.value },
                  }))
                }
                placeholder={`${type.toUpperCase()} Title`}
                className="w-48"
              />
              <Select
                value={contentData.status}
                onValueChange={(value: DocStatus) =>
                  setContent((prev) => ({
                    ...prev,
                    [type]: { ...prev[type], status: value },
                  }))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={currentViewMode === "edit" ? "default" : "outline"}
              onClick={() => setViewMode((prev) => ({ ...prev, [type]: "edit" }))}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant={currentViewMode === "preview" ? "default" : "outline"}
              onClick={() => setViewMode((prev) => ({ ...prev, [type]: "preview" }))}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" onClick={type === "prd" ? savePRD : saveSpec}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 space-y-4">
          {type === "spec" && currentViewMode === "edit" && (
            <Textarea
              value={content.spec.technical_details}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  spec: { ...prev.spec, technical_details: e.target.value },
                }))
              }
              placeholder="Technical details..."
              className="h-24 resize-none"
            />
          )}

          {currentViewMode === "edit" ? (
            <Textarea
              value={type === "prd" ? contentData.content : content.spec.content}
              onChange={(e) => {
                if (type === "prd") {
                  setContent((prev) => ({
                    ...prev,
                    prd: { ...prev.prd, content: e.target.value },
                  }));
                } else {
                  setContent((prev) => ({
                    ...prev,
                    spec: { ...prev.spec, content: e.target.value },
                  }));
                }
              }}
              className="flex-1 font-mono text-sm resize-none h-full"
              placeholder={`Enter ${type.toUpperCase()} content in Markdown format...`}
            />
          ) : (
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-6">
                {contentData.content ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {type === "prd" ? contentData.content : content.spec.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No {type.toUpperCase()} content yet.</p>
                    <p className="text-sm">Switch to Edit mode to start writing.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Loading project data...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-card">
      {/* Project header */}
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Editable Title */}
            <div className="mb-3">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    className="text-2xl font-bold h-auto py-1 px-2 border-0 shadow-none bg-transparent"
                    onKeyPress={(e) => e.key === "Enter" && saveProject()}
                    autoFocus
                  />
                  <Button size="sm" onClick={saveProject} className="shrink-0">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setLocalTitle(project.name);
                      setEditingTitle(false);
                    }}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Editable Description */}
            <div className="mb-3">
              {editingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    className="min-h-[60px] resize-none"
                    placeholder="Enter a brief description for this project..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveProject}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLocalDescription(project.description || "");
                        setEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group cursor-pointer" onClick={() => setEditingDescription(true)}>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                    {project.description || "Click to add a description..."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">ID: {projectId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for PRD and Spec */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          // Update URL hash to reflect current tab
          navigate(`${location.pathname}#${value}`, { replace: true });
        }}
        className="flex-1 flex flex-col"
      >
        <div className="border-b border-border px-6">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="prd"
              className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              PRD
            </TabsTrigger>
            <TabsTrigger
              value="spec"
              className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-3"
            >
              <Code className="w-4 h-4 mr-2" />
              Spec
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent
            value="prd"
            className="h-full m-0 p-6 flex flex-col data-[state=inactive]:hidden"
          >
            {renderContent("prd")}
          </TabsContent>
          <TabsContent
            value="spec"
            className="h-full m-0 p-6 flex flex-col data-[state=inactive]:hidden"
          >
            {renderContent("spec")}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
