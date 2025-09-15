import { useState, useEffect } from "react";
import {
  Plus,
  Folder,
  BarChart3,
  User,
  Settings,
  ChevronRight,
  Zap,
  Building2,
} from "lucide-react";
import pandaLogo from "@/assets/panda-logo-final.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProjectStore } from "@/lib/projectStore";

const appSections = [
  { title: "Company Info", url: "/company-info", icon: Building2 },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Templates", url: "/templates", icon: Settings },
  { title: "Integrations", url: "/integrations", icon: Zap },
];

export function ProjectSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState("1");

  // Use the shared project store
  const projects = useProjectStore((state) => state.projects);
  const loading = useProjectStore((state) => state.loading);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const createProject = useProjectStore((state) => state.createProject);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createNewProject = async () => {
    const projectName = `New Project ${Date.now()}`;
    const project = await createProject(
      projectName,
      "Enter a brief description for this project..."
    );

    if (project) {
      setSelectedProject(project.id.toString());
      navigate(`/project/${project.id}`);

      toast({
        title: "Project created!",
        description: `${project.name} has been created successfully.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getNavCls = (isActive: boolean) =>
    cn(
      "w-full justify-start text-sm font-medium transition-colors min-h-[3rem] py-2 px-3",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
    );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img
                src={pandaLogo}
                alt="PMPanda Logo"
                className="w-8 h-8 object-contain rounded-lg"
              />
            </div>
            {open && (
              <div>
                <h2 className="text-sm font-semibold text-sidebar-foreground">PMPanda</h2>
                <p className="text-xs text-sidebar-foreground/60">AI Product Manager</p>
              </div>
            )}
          </div>
          {open && <SidebarTrigger />}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Projects section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide px-2 flex items-center justify-between">
            {open && "Projects"}
            {open && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-sidebar-accent"
                onClick={createNewProject}
                title="Create new project"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Projects */}
              {projects.map((project) => (
                <div key={project.id}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/project/${project.id}`}
                        className={({ isActive }) => getNavCls(isActive)}
                        onClick={() => setSelectedProject(project.id.toString())}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Folder className="w-4 h-4 shrink-0" />
                          {open && (
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="truncate text-sm font-medium leading-tight">
                                {project.name}
                              </p>
                              <p className="truncate text-xs text-sidebar-foreground/50 leading-tight mt-0.5">
                                {project.description &&
                                project.description !==
                                  "Enter a brief description for this project..."
                                  ? project.description
                                  : "No description"}
                              </p>
                            </div>
                          )}
                        </div>
                        {open && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Project Roadmap Link */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/project/${project.id}/roadmap`}
                        className={({ isActive }) => cn(getNavCls(isActive), "ml-8")}
                      >
                        <BarChart3 className="w-4 h-4 shrink-0" />
                        {open && <span>Roadmap</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              ))}

              {loading && (
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Loading projects...
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* App-level sections */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide px-2">
            {open ? "Navigate" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {appSections.map((section) => (
                <SidebarMenuItem key={section.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={section.url} className={({ isActive }) => getNavCls(isActive)}>
                      <section.icon className="w-4 h-4" />
                      {open && <span>{section.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
