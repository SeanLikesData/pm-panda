import { api } from './api';

export interface RoadmapTask {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "planned" | "in-progress" | "completed";
  quarter: string;
  estimated_effort?: string | null;
  dependencies?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoadmapTaskDTO {
  title: string;
  description?: string | null;
  priority?: RoadmapTask["priority"];
  status?: RoadmapTask["status"];
  quarter: string;
  estimated_effort?: string | null;
  dependencies?: string | null;
}

export interface UpdateRoadmapTaskDTO {
  title?: string;
  description?: string | null;
  priority?: RoadmapTask["priority"];
  status?: RoadmapTask["status"];
  quarter?: string;
  estimated_effort?: string | null;
  dependencies?: string | null;
}

export const roadmapApi = {
  // Get all roadmap tasks for a project
  async getProjectRoadmap(projectId: number): Promise<RoadmapTask[]> {
    return await api.get<RoadmapTask[]>(`/projects/${projectId}/roadmap`);
  },

  // Create a single roadmap task
  async createTask(projectId: number, task: CreateRoadmapTaskDTO): Promise<RoadmapTask> {
    return await api.post<RoadmapTask>(`/projects/${projectId}/roadmap`, task);
  },

  // Create multiple roadmap tasks
  async createMultipleTasks(projectId: number, tasks: CreateRoadmapTaskDTO[]): Promise<RoadmapTask[]> {
    return await api.post<RoadmapTask[]>(`/projects/${projectId}/roadmap/bulk`, { tasks });
  },

  // Get a specific roadmap task
  async getTask(taskId: number): Promise<RoadmapTask> {
    return await api.get<RoadmapTask>(`/roadmap/${taskId}`);
  },

  // Update a roadmap task
  async updateTask(taskId: number, updates: UpdateRoadmapTaskDTO): Promise<RoadmapTask> {
    return await api.put<RoadmapTask>(`/roadmap/${taskId}`, updates);
  },

  // Delete a roadmap task
  async deleteTask(taskId: number): Promise<void> {
    await api.delete<void>(`/roadmap/${taskId}`);
  },

  // Get tasks by quarter
  async getTasksByQuarter(projectId: number, quarter: string): Promise<RoadmapTask[]> {
    return await api.get<RoadmapTask[]>(`/projects/${projectId}/roadmap/quarter/${quarter}`);
  },

  // Get tasks by status
  async getTasksByStatus(projectId: number, status: RoadmapTask["status"]): Promise<RoadmapTask[]> {
    return await api.get<RoadmapTask[]>(`/projects/${projectId}/roadmap/status/${status}`);
  },

  // Clear all roadmap tasks for a project
  async clearProjectRoadmap(projectId: number): Promise<void> {
    await api.delete<void>(`/projects/${projectId}/roadmap`);
  }
};
