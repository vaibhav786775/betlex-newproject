import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import * as teamController from "../controllers/team.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import registrationRouter from "./registration.routes";

const eventRouter = Router();

// Nested routes for events
eventRouter.use("/:id", registrationRouter);

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List events
 *     description: Retrieve all hackathons with optional filter parameters.
 *     tags:
 *       - Events
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [draft, open, active, judging, closed]
 *       - name: tag
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event list fetched.
 *   post:
 *     summary: Create event
 *     description: Creates a new event. Organizer or Admin only.
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - slug
 *               - registrationOpen
 *               - registrationClose
 *               - eventStart
 *               - eventEnd
 *               - submissionDeadline
 *               - timezone
 *               - prizePool
 *             properties:
 *               title:
 *                 type: string
 *                 example: Global Hackathon 2026
 *               description:
 *                 type: string
 *                 example: Build something incredible in 48 hours.
 *               slug:
 *                 type: string
 *                 example: global-hack-2026
 *               registrationOpen:
 *                 type: string
 *                 format: date-time
 *               registrationClose:
 *                 type: string
 *                 format: date-time
 *               eventStart:
 *                 type: string
 *                 format: date-time
 *               eventEnd:
 *                 type: string
 *                 format: date-time
 *               submissionDeadline:
 *                 type: string
 *                 format: date-time
 *               timezone:
 *                 type: string
 *                 example: Asia/Kolkata
 *               prizePool:
 *                 type: object
 *                 example: { "total": "$10,000" }
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ai", "typescript"]
 *     responses:
 *       201:
 *         description: Event created successfully.
 *       403:
 *         description: Forbidden. Only organizers and admins.
 */
eventRouter.get("/", eventController.getEvents);

/**
 * @openapi
 * /events/{slug}:
 *   get:
 *     summary: Get event by slug
 *     description: Retrieve details for a specific event slug.
 *     tags:
 *       - Events
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: global-hack-2026
 *     responses:
 *       200:
 *         description: Event details.
 *       404:
 *         description: Event not found.
 */
eventRouter.get("/:slug", eventController.getEventBySlug);

/**
 * @openapi
 * /events/{id}/stats:
 *   get:
 *     summary: Get event live stats
 *     description: Retrieve counts of registrations, teams, projects, and judges. Organizer or Admin only.
 *     tags:
 *       - Events
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
 *         description: Event stats.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Event not found.
 */
eventRouter.get("/:id/stats", eventController.getEventStats);

/**
 * @openapi
 * /events/{id}/teams:
 *   post:
 *     summary: Create a team
 *     description: Creates a new team for an event. Must be a registered participant.
 *     tags:
 *       - Teams
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bug Smashers
 *               track:
 *                 type: string
 *                 example: Health Track
 *     responses:
 *       201:
 *         description: Team created.
 *   get:
 *     summary: List event teams
 *     description: Retrieves list of teams created for this event.
 *     tags:
 *       - Teams
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Teams list.
 */
eventRouter.post("/:id/teams", authMiddleware, teamController.createTeam);
eventRouter.get("/:id/teams", teamController.getEventTeams);

/**
 * @openapi
 * /events/{id}:
 *   patch:
 *     summary: Update event
 *     description: Update event configuration. Only organizer/admin.
 *     tags:
 *       - Events
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated.
 *   delete:
 *     summary: Delete event (soft delete)
 *     description: Soft-deletes the event. Admin only.
 *     tags:
 *       - Events
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
 *         description: Event soft deleted.
 */
eventRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  eventController.createEvent
);

eventRouter.patch(
  "/:id",
  authMiddleware,
  eventController.updateEvent
);

eventRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  eventController.deleteEvent
);

export default eventRouter;
