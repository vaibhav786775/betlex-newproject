import { Router } from "express";
import * as announcementController from "../controllers/announcement.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const announcementRouter = Router();

announcementRouter.use(authMiddleware);

// Participant/Collective routes
announcementRouter.get("/events/:id/announcements", announcementController.getAnnouncements);
announcementRouter.get("/events/:id/announcements/unread-count", announcementController.getUnreadCount);
announcementRouter.post("/events/:id/announcements/:annId/read", announcementController.markRead);
announcementRouter.get("/events/:id/announcements/live", announcementController.listenToAnnouncements);

// Organizer routes
announcementRouter.post(
  "/events/:id/announcements", 
  roleMiddleware("organizer", "admin"), 
  announcementController.createAnnouncement
);

announcementRouter.post(
  "/events/:id/announcements/:annId/publish", 
  roleMiddleware("organizer", "admin"), 
  announcementController.publishAnnouncement
);

export default announcementRouter;
