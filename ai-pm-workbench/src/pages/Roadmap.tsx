import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { roadmapApi, RoadmapTask } from "@/lib/roadmapApi";
import { agentsApi } from "@/lib/agentsApi";
import { useProjectStore } from "@/lib/projectStore";
import { prdApi } from "@/lib/prdApi";

export default function Roadmap() {
  const { projects } = useProjectStore();
  const { toast } = useToast();
  const [roadmapTasks, setRoadmapTasks] = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Get current year quarters
  const currentYear = new Date().getFullYear();
  const quarters = [
    `Q1 ${currentYear}`,
    `Q2 ${currentYear}`,
    `Q3 ${currentYear}`,
    `Q4 ${currentYear}`,
  ];

  // Set default project selection
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Load roadmap tasks for selected project
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectRoadmap(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjectRoadmap = async (projectId: number) => {
    try {
      setLoading(true);
      const projectTasks = await roadmapApi.getProjectRoadmap(projectId);
      setRoadmapTasks(projectTasks);
    } catch (error) {
      console.error(`Failed to load roadmap for project ${projectId}:`, error);
      toast({
        title: "Error",
        description: "Failed to load roadmap tasks",
        variant: "destructive",
      });
      setRoadmapTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: RoadmapTask["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "planned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: RoadmapTask["priority"]) => {
    switch (priority) {
      case "P0":
        return "text-red-600 font-bold dark:text-red-400";
      case "P1":
        return "text-orange-600 font-semibold dark:text-orange-400";
      case "P2":
        return "text-blue-600 font-medium dark:text-blue-400";
      case "P3":
        return "text-gray-500 dark:text-gray-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  };

  const moveTaskQuarter = async (taskId: number, direction: "up" | "down") => {
    const task = roadmapTasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentQuarterIndex = quarters.indexOf(task.quarter);
    let newQuarterIndex;

    if (direction === "up") {
      newQuarterIndex = Math.max(0, currentQuarterIndex - 1);
    } else {
      newQuarterIndex = Math.min(quarters.length - 1, currentQuarterIndex + 1);
    }

    if (newQuarterIndex !== currentQuarterIndex) {
      const newQuarter = quarters[newQuarterIndex];

      try {
        await roadmapApi.updateTask(taskId, { quarter: newQuarter });

        // Update local state
        setRoadmapTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, quarter: newQuarter } : t))
        );

        toast({
          title: "Task moved",
          description: `Moved task to ${newQuarter}`,
        });
      } catch (error) {
        console.error("Failed to move task:", error);
        toast({
          title: "Error",
          description: "Failed to move task",
          variant: "destructive",
        });
      }
    }
  };

  const generateRoadmapForProject = async () => {
    if (!selectedProjectId) return;

    try {
      setGeneratingRoadmap(true);

      // Get the project's PRD content
      const prd = await prdApi.get(selectedProjectId);
      if (!prd || !prd.content) {
        toast({
          title: "No PRD found",
          description: "Please create a PRD for this project first",
          variant: "destructive",
        });
        return;
      }

      // Generate roadmap using AI
      await agentsApi.generateRoadmap({
        message: "Generate comprehensive roadmap tasks from this PRD",
        project_id: selectedProjectId,
        project_context: {
          existing_prd: prd.content,
          existing_roadmap: roadmapTasks,
        },
      });

      toast({
        title: "Roadmap generated!",
        description: "AI has created roadmap tasks from your PRD",
      });

      // Reload roadmap tasks to show the new ones
      await loadProjectRoadmap(selectedProjectId);
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate roadmap tasks",
        variant: "destructive",
      });
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: RoadmapTask["status"]) => {
    try {
      await roadmapApi.updateTask(taskId, { status: newStatus });

      // Update local state
      setRoadmapTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      toast({
        title: "Status updated",
        description: `Task marked as ${newStatus.replace("-", " ")}`,
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await roadmapApi.deleteTask(taskId);

      // Update local state
      setRoadmapTasks((prev) => prev.filter((t) => t.id !== taskId));

      toast({
        title: "Task deleted",
        description: "Roadmap task has been deleted",
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedItem(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetQuarter: string) => {
    e.preventDefault();

    if (!draggedItem) {
      setDraggedItem(null);
      return;
    }

    const draggedTask = roadmapTasks.find((t) => t.id === draggedItem);
    if (draggedTask && draggedTask.quarter !== targetQuarter) {
      try {
        await roadmapApi.updateTask(draggedItem, { quarter: targetQuarter });

        // Update local state
        setRoadmapTasks((prev) =>
          prev.map((t) => (t.id === draggedItem ? { ...t, quarter: targetQuarter } : t))
        );

        toast({
          title: "Task moved",
          description: `Moved task to ${targetQuarter}`,
        });
      } catch (error) {
        console.error("Failed to move task:", error);
        toast({
          title: "Error",
          description: "Failed to move task",
          variant: "destructive",
        });
      }
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading roadmap...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Roadmap</h1>
          <p className="text-muted-foreground mt-1">AI-generated roadmap tasks from your PRD</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedProjectId?.toString() || ""}
            onValueChange={(value) => setSelectedProjectId(parseInt(value))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-gradient-primary"
            onClick={generateRoadmapForProject}
            disabled={generatingRoadmap || !selectedProjectId}
          >
            {generatingRoadmap ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Roadmap
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Roadmap by Quarters */}
      <div className="grid gap-6">
        {quarters.map((quarter) => {
          const quarterTasks = roadmapTasks.filter((task) => task.quarter === quarter);

          return (
            <Card key={quarter} className="bg-gradient-card">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {quarter}
                  </CardTitle>
                  <Badge variant="outline">
                    {quarterTasks.length} task{quarterTasks.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent
                className="p-6"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, quarter)}
              >
                {quarterTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks planned for this quarter</p>
                    <p className="text-sm mt-2">Generate AI roadmap or drag tasks here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quarterTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={`border border-border/50 transition-all duration-200 cursor-move hover:shadow-md ${
                          draggedItem === task.id ? "opacity-50 scale-95" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-foreground">{task.title}</h3>
                                <Badge className={getStatusColor(task.status)} variant="secondary">
                                  {task.status.replace("-", " ")}
                                </Badge>
                                <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {task.estimated_effort && (
                                  <Badge variant="outline" className="text-xs">
                                    {task.estimated_effort}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Project: {getProjectName(task.project_id)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveTaskQuarter(task.id, "up")}
                                className="h-8 w-8 p-0"
                                disabled={quarters.indexOf(task.quarter) === 0}
                                title="Move to previous quarter"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveTaskQuarter(task.id, "down")}
                                className="h-8 w-8 p-0"
                                disabled={quarters.indexOf(task.quarter) === quarters.length - 1}
                                title="Move to next quarter"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-popover border border-border shadow-md"
                                >
                                  <DropdownMenuItem
                                    onClick={() => updateTaskStatus(task.id, "planned")}
                                  >
                                    Mark as Planned
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateTaskStatus(task.id, "in-progress")}
                                  >
                                    Mark as In Progress
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateTaskStatus(task.id, "completed")}
                                  >
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    Delete Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
