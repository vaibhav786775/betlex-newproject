import { Router } from "express";
import * as announcementController from "../controllers/announcement.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const announcementRouter = Router();

announcementRouter.use(authMiddleware);

/**
 * @openapi
 * /events/{id}/announcements:
 *   get:
 *     summary: List announcements
 *     description: Retrieve all published announcements matching user's role on specific event.
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement list.
 *   post:
 *     summary: Create announcement draft
 *     description: Creates an announcement draft. Organizer/Admin only.
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 example: Submission Deadline Extended!
 *               body:
 *                 type: string
 *                 example: Submission is extended by 2 hours.
 *               priority:
 *                 type: string
 *                 enum: [info, warning, urgent]
 *                 default: info
 *               target:
 *                 type: string
 *                 enum: [all, participants, judges, organizers]
 *                 default: all
 *     responses:
 *       201:
 *         description: Announcement draft created.
 *       403:
 *         description: Forbidden.
 */
announcementRouter.get("/events/:id/announcements", announcementController.getAnnouncements);

/**
 * @openapi
 * /events/{id}/announcements/unread-count:
 *   get:
 *     summary: Get unread count
 *     description: Retrieves the number of unread announcements for the user.
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unread count object.
 */
announcementRouter.get("/events/:id/announcements/unread-count", announcementController.getUnreadCount);

/**
 * @openapi
 * /events/{id}/announcements/{annId}/read:
 *   post:
 *     summary: Mark announcement as read
 *     description: Mark a specific announcement as read by current user.
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: annId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marked as read successfully.
 */
announcementRouter.post("/events/:id/announcements/:annId/read", announcementController.markRead);

/**
 * @openapi
 * /events/{id}/announcements/live:
 *   get:
 *     summary: Real-time announcements updates via SSE
 *     description: SSE stream to broadcast new published announcements live.
 *     tags:
 *       - Announcements
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: SSE connection established.
 */
announcementRouter.get("/events/:id/announcements/live", announcementController.listenToAnnouncements);

/**
 * @openapi
 * /events/{id}/announcements/{annId}/publish:
 *   post:
 *     summary: Publish announcement
 *     description: Publishes a draft announcement, triggering real-time stream broadcast. Organizer/Admin only.
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: annId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement published.
 *       403:
 *         description: Forbidden.
 */
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
