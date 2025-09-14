import { run, get, all } from "../config/database.js";
import type { RoadmapTask, CreateRoadmapTaskDTO, UpdateRoadmapTaskDTO } from "../types/index.js";

export class RoadmapRepository {
  private static async projectExists(projectId: number): Promise<boolean> {
    const row = await get<{ id: number }>(`SELECT id FROM projects WHERE id = ?`, [projectId]);
    return !!row;
  }

  static async create(projectId: number, data: CreateRoadmapTaskDTO): Promise<RoadmapTask> {
    const exists = await this.projectExists(projectId);
    if (!exists) {
      throw Object.assign(new Error("Project not found"), { status: 404 });
    }
    const result = await run(
      `INSERT INTO roadmap_tasks (project_id, title, description, priority, status, quarter, estimated_effort, dependencies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        data.title,
        data.description || null,
        data.priority || "P2",
        data.status || "planned",
        data.quarter,
        data.estimated_effort || null,
        data.dependencies || null
      ]
    );

    const task = await get<RoadmapTask>(
      "SELECT * FROM roadmap_tasks WHERE id = ?",
      [result.lastID]
    );

    if (!task) {
      throw new Error("Failed to create roadmap task");
    }

    return task;
  }

  static async findByProjectId(projectId: number): Promise<RoadmapTask[]> {
    return await all<RoadmapTask>(
      "SELECT * FROM roadmap_tasks WHERE project_id = ? ORDER BY quarter, priority, created_at",
      [projectId]
    );
  }

  static async findById(id: number): Promise<RoadmapTask | undefined> {
    return await get<RoadmapTask>(
      "SELECT * FROM roadmap_tasks WHERE id = ?",
      [id]
    );
  }

  static async update(id: number, data: UpdateRoadmapTaskDTO): Promise<RoadmapTask> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.priority !== undefined) {
      updates.push("priority = ?");
      values.push(data.priority);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }
    if (data.quarter !== undefined) {
      updates.push("quarter = ?");
      values.push(data.quarter);
    }
    if (data.estimated_effort !== undefined) {
      updates.push("estimated_effort = ?");
      values.push(data.estimated_effort);
    }
    if (data.dependencies !== undefined) {
      updates.push("dependencies = ?");
      values.push(data.dependencies);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await run(
      `UPDATE roadmap_tasks SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const task = await get<RoadmapTask>(
      "SELECT * FROM roadmap_tasks WHERE id = ?",
      [id]
    );

    if (!task) {
      throw new Error("Roadmap task not found after update");
    }

    return task;
  }

  static async delete(id: number): Promise<void> {
    const result = await run("DELETE FROM roadmap_tasks WHERE id = ?", [id]);
    
    if (result.changes === 0) {
      throw new Error("Roadmap task not found");
    }
  }

  static async deleteByProjectId(projectId: number): Promise<void> {
    await run("DELETE FROM roadmap_tasks WHERE project_id = ?", [projectId]);
  }

  static async createMany(projectId: number, tasks: CreateRoadmapTaskDTO[]): Promise<RoadmapTask[]> {
    const createdTasks: RoadmapTask[] = [];
    
    for (const taskData of tasks) {
      const task = await this.create(projectId, taskData);
      createdTasks.push(task);
    }
    
    return createdTasks;
  }

  static async findByQuarter(projectId: number, quarter: string): Promise<RoadmapTask[]> {
    return await all<RoadmapTask>(
      "SELECT * FROM roadmap_tasks WHERE project_id = ? AND quarter = ? ORDER BY priority, created_at",
      [projectId, quarter]
    );
  }

  static async findByStatus(projectId: number, status: RoadmapTask["status"]): Promise<RoadmapTask[]> {
    return await all<RoadmapTask>(
      "SELECT * FROM roadmap_tasks WHERE project_id = ? AND status = ? ORDER BY quarter, priority, created_at",
      [projectId, status]
    );
  }
}
