import { create } from 'zustand';
import { projectApi } from './projectApi';
import { refreshProjectData } from './projectDataRefresh';
import type { BackendProject } from './types';

interface ProjectStore {
  projects: BackendProject[];
  loading: boolean;
  error: string | null;
  
  // Project operations
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<BackendProject | null>;
  updateProject: (id: number, updates: { name?: string; description?: string | null }) => Promise<BackendProject | null>;
  refreshProject: (id: number) => Promise<void>;
  getProject: (id: number) => BackendProject | undefined;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  
  // Project operations
  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectApi.getAll();
      set({ projects, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load projects', loading: false });
    }
  },
  
  createProject: async (name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectApi.create({ name, description });
      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false
      }));
      return newProject;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create project', loading: false });
      return null;
    }
  },
  
  updateProject: async (id: number, updates: { name?: string; description?: string | null }) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = await projectApi.update(id, updates);
      set((state) => ({
        projects: state.projects.map(project => 
          project.id === id ? updatedProject : project
        ),
        loading: false
      }));
      return updatedProject;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update project', loading: false });
      return null;
    }
  },
  
  refreshProject: async (id: number) => {
    try {
      const result = await refreshProjectData(id);
      if (result.project) {
        set((state) => ({
          projects: state.projects.map(project => 
            project.id === id ? result.project! : project
          )
        }));
      }
    } catch (error) {
      console.error('Failed to refresh project in store:', error);
    }
  },
  
  getProject: (id: number) => {
    return get().projects.find(project => project.id === id);
  },
}));
