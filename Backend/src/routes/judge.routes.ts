import { Router } from "express";
import * as judgeController from "../controllers/judge.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const judgeRouter = Router();

judgeRouter.use(authMiddleware);

// Judge specific routes
judgeRouter.get(
  "/projects",
  roleMiddleware("judge", "admin"),
  judgeController.getAssignedProjects
);

judgeRouter.get(
  "/projects/:id",
  roleMiddleware("judge", "admin"),
  judgeController.getProjectForJudge
);

judgeRouter.post(
  "/projects/:id/score",
  roleMiddleware("judge"),
  judgeController.submitScore
);

judgeRouter.patch(
  "/projects/:id/score",
  roleMiddleware("judge"),
  judgeController.submitScore // Reuse upsert
);

// Admin/Organizer routes
judgeRouter.get(
  "/events/:id/scores",
  roleMiddleware("organizer", "admin"),
  judgeController.getEventScores
);

export default judgeRouter;
