import { Router } from "express";
import * as registrationController from "../controllers/registration.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const registrationRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /events/{id}/register:
 *   post:
 *     summary: Register for event
 *     description: Register the current user to a specific event.
 *     tags:
 *       - Registrations
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
 *               registrationData:
 *                 type: object
 *                 example: { "skills": ["react", "nodejs"], "experience": "intermediate" }
 *               teamId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Registered successfully.
 *       409:
 *         description: Already registered.
 */
registrationRouter.post("/register", authMiddleware, registrationController.register);

/**
 * @openapi
 * /events/{id}/registration:
 *   get:
 *     summary: Get my registration
 *     description: Get registration details for current user on specific event.
 *     tags:
 *       - Registrations
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
 *         description: Registration details retrieved.
 *       404:
 *         description: Not registered.
 *   delete:
 *     summary: Cancel registration
 *     description: Cancel user's registration. Allowed before event starts only.
 *     tags:
 *       - Registrations
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
 *         description: Registration cancelled successfully.
 *       400:
 *         description: Cannot cancel after event starts.
 */
registrationRouter.get("/registration", authMiddleware, registrationController.getRegistration);
registrationRouter.delete("/registration", authMiddleware, registrationController.deleteRegistration);

/**
 * @openapi
 * /events/{id}/registrations:
 *   get:
 *     summary: List event registrations
 *     description: Retrieves registrations list with CSV export support. Organizer/Admin only.
 *     tags:
 *       - Registrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Registrations list.
 *       403:
 *         description: Forbidden.
 */
registrationRouter.get(
  "/registrations",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  registrationController.getRegistrations
);

export default registrationRouter;
