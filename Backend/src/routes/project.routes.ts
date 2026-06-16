import { Router } from "express";
import * as projectController from "../controllers/project.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const projectRouter = Router();

projectRouter.use(authMiddleware);


projectRouter.post("/teams/:id/project", projectController.createProject);
projectRouter.get("/teams/:id/project", projectController.getProject);
projectRouter.patch("/teams/:id/project", projectController.updateProject);
projectRouter.post("/teams/:id/project/submit", projectController.submitProject);
projectRouter.post("/teams/:id/project/deck", projectController.uploadDeck);



projectRouter.get(
  "/events/:id/projects",
  roleMiddleware("organizer", "admin", "judge"),
  projectController.getEventProjects
);

export default projectRouter;