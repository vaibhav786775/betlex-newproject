import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import authMiddleware from "../middleware/auth.middleware";

const teamRouter = Router();

teamRouter.use(authMiddleware);

// These are for specific team operations
teamRouter.post("/join", teamController.joinTeam);
teamRouter.get("/:id", teamController.getTeamById);
teamRouter.patch("/:id", teamController.updateTeam);
teamRouter.delete("/:id", teamController.deleteTeam);
teamRouter.delete("/:id/members/:userId", teamController.removeMember);

export default teamRouter;
