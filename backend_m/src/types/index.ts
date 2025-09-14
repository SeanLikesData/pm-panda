export interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface Project extends Timestamps {
  id: number;
  name: string;
  description?: string | null;
}

export interface PRD extends Timestamps {
  id: number;
  project_id: number;
  title: string;
  content?: string | null;
  status: "draft" | "review" | "approved";
}

export interface Spec extends Timestamps {
  id: number;
  project_id: number;
  title: string;
  content?: string | null;
  technical_details?: string | null;
  status: "draft" | "review" | "approved";
}

export interface RoadmapTask extends Timestamps {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "planned" | "in-progress" | "completed";
  quarter: string;
  estimated_effort?: string | null;
  dependencies?: string | null; // JSON array of task IDs
}

// Create/Update DTOs
export interface CreateProjectDTO {
  name: string;
  description?: string | null;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
}

export interface CreatePRDDTO {
  title: string;
  content?: string | null;
  status?: PRD["status"];
}

export interface UpdatePRDDTO {
  title?: string;
  content?: string | null;
  status?: PRD["status"];
}

export interface CreateSpecDTO {
  title: string;
  content?: string | null;
  technical_details?: string | null;
  status?: Spec["status"];
}

export interface UpdateSpecDTO {
  title?: string;
  content?: string | null;
  technical_details?: string | null;
  status?: Spec["status"];
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
