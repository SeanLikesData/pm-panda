import { Request, Response } from "express";
import { RoadmapRepository } from "../repositories/RoadmapRepository.js";
import type { CreateRoadmapTaskDTO, UpdateRoadmapTaskDTO } from "../types/index.js";

export class RoadmapController {
  // GET /api/projects/:projectId/roadmap
  static async getProjectRoadmap(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const tasks = await RoadmapRepository.findByProjectId(projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      if (error instanceof Error && 'status' in error) {
        return res.status((error as any).status).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST /api/projects/:projectId/roadmap
  static async createRoadmapTask(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const taskData: CreateRoadmapTaskDTO = req.body;
      
      // Validate required fields
      if (!taskData.title || !taskData.quarter) {
        return res.status(400).json({ error: "Title and quarter are required" });
      }

      const task = await RoadmapRepository.create(projectId, taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating roadmap task:", error);
      if (error instanceof Error && 'status' in error) {
        return res.status((error as any).status).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST /api/projects/:projectId/roadmap/bulk
  static async createMultipleRoadmapTasks(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const tasksData: CreateRoadmapTaskDTO[] = req.body.tasks;
      
      if (!Array.isArray(tasksData) || tasksData.length === 0) {
        return res.status(400).json({ error: "Tasks array is required and must not be empty" });
      }

      // Validate each task
      for (const taskData of tasksData) {
        if (!taskData.title || !taskData.quarter) {
          return res.status(400).json({ error: "Each task must have title and quarter" });
        }
      }

      const tasks = await RoadmapRepository.createMany(projectId, tasksData);
      res.status(201).json(tasks);
    } catch (error) {
      console.error("Error creating multiple roadmap tasks:", error);
      if (error instanceof Error && 'status' in error) {
        return res.status((error as any).status).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/roadmap/:taskId
  static async getRoadmapTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      const task = await RoadmapRepository.findById(taskId);
      if (!task) {
        return res.status(404).json({ error: "Roadmap task not found" });
      }

      res.json(task);
    } catch (error) {
      console.error("Error fetching roadmap task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // PUT /api/roadmap/:taskId
  static async updateRoadmapTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      const updateData: UpdateRoadmapTaskDTO = req.body;
      const task = await RoadmapRepository.update(taskId, updateData);
      res.json(task);
    } catch (error) {
      console.error("Error updating roadmap task:", error);
      if (error instanceof Error && error.message === "Roadmap task not found after update") {
        return res.status(404).json({ error: "Roadmap task not found" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /api/roadmap/:taskId
  static async deleteRoadmapTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      await RoadmapRepository.delete(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting roadmap task:", error);
      if (error instanceof Error && error.message === "Roadmap task not found") {
        return res.status(404).json({ error: "Roadmap task not found" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/projects/:projectId/roadmap/quarter/:quarter
  static async getRoadmapByQuarter(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      const quarter = req.params.quarter;
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const tasks = await RoadmapRepository.findByQuarter(projectId, quarter);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching roadmap by quarter:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/projects/:projectId/roadmap/status/:status
  static async getRoadmapByStatus(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      const status = req.params.status as "planned" | "in-progress" | "completed";
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      if (!["planned", "in-progress", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const tasks = await RoadmapRepository.findByStatus(projectId, status);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching roadmap by status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /api/projects/:projectId/roadmap
  static async deleteProjectRoadmap(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      await RoadmapRepository.deleteByProjectId(projectId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project roadmap:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
