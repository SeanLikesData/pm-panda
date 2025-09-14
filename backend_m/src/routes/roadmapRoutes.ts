import { Router } from "express";
import { RoadmapController } from "../controllers/RoadmapController.js";

const router = Router();

// Project-specific roadmap routes
router.get("/projects/:projectId/roadmap", RoadmapController.getProjectRoadmap);
router.post("/projects/:projectId/roadmap", RoadmapController.createRoadmapTask);
router.post("/projects/:projectId/roadmap/bulk", RoadmapController.createMultipleRoadmapTasks);
router.get("/projects/:projectId/roadmap/quarter/:quarter", RoadmapController.getRoadmapByQuarter);
router.get("/projects/:projectId/roadmap/status/:status", RoadmapController.getRoadmapByStatus);
router.delete("/projects/:projectId/roadmap", RoadmapController.deleteProjectRoadmap);

// Individual task routes
router.get("/roadmap/:taskId", RoadmapController.getRoadmapTask);
router.put("/roadmap/:taskId", RoadmapController.updateRoadmapTask);
router.delete("/roadmap/:taskId", RoadmapController.deleteRoadmapTask);

export default router;
