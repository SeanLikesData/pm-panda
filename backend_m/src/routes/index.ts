import { Router } from "express";
import projectRoutes from "./projectRoutes.js";
import prdRoutes from "./prdRoutes.js";
import specRoutes from "./specRoutes.js";
import chatRoutes from "./chatRoutes.js";
import roadmapRoutes from "./roadmapRoutes.js";

const router = Router();

// Projects CRUD
router.use("/projects", projectRoutes);

// One-to-one nested resources under a project
router.use("/projects/:projectId/prd", prdRoutes);
router.use("/projects/:projectId/spec", specRoutes);

// Chat messages for a project
router.use("/projects/:projectId/chat", chatRoutes);

// Roadmap routes (includes both project-specific and individual task routes)
router.use("/", roadmapRoutes);

export default router;
