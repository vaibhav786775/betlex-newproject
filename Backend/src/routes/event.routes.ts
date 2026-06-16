import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import * as teamController from "../controllers/team.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import registrationRouter from "./registration.routes";

const eventRouter = Router();

// Nested routes for events
eventRouter.use("/:id", registrationRouter);

// Event management
eventRouter.get("/", eventController.getEvents);
eventRouter.get("/:slug", eventController.getEventBySlug);
eventRouter.get("/:id/stats", eventController.getEventStats);

// Event-specific Team operations
eventRouter.post("/:id/teams", authMiddleware, teamController.createTeam);
eventRouter.get("/:id/teams", teamController.getEventTeams);

// Organizer/Admin only
eventRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  eventController.createEvent
);

// Protected update
eventRouter.patch(
  "/:id",
  authMiddleware,
  eventController.updateEvent
);

// Admin only delete
eventRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  eventController.deleteEvent
);

export default eventRouter;
