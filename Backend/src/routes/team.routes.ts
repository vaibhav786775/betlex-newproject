import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import authMiddleware from "../middleware/auth.middleware";

const teamRouter = Router();

teamRouter.use(authMiddleware);

/**
 * @openapi
 * /teams/join:
 *   post:
 *     summary: Join a team
 *     description: Joins an existing team using its unique invite code.
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 example: A1B2C3D4E5
 *     responses:
 *       200:
 *         description: Successfully joined the team.
 *       404:
 *         description: Team not found.
 *       409:
 *         description: Already a member of this team.
 */
teamRouter.post("/join", teamController.joinTeam);

/**
 * @openapi
 * /teams/{id}:
 *   get:
 *     summary: Get team details
 *     description: Retrieve detailed information for a specific team.
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
 *     responses:
 *       200:
 *         description: Team details.
 *       404:
 *         description: Team not found.
 *   patch:
 *     summary: Update team
 *     description: Update team configuration (name or track). Leader only.
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Name
 *               track:
 *                 type: string
 *                 example: Artificial Intelligence
 *               isOpen:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Team updated.
 *       403:
 *         description: Forbidden.
 *   delete:
 *     summary: Disband team
 *     description: Disband the team. Leader only, allowed before submission deadline.
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
 *     responses:
 *       200:
 *         description: Team disbanded.
 *       403:
 *         description: Forbidden.
 */
teamRouter.get("/:id", teamController.getTeamById);
teamRouter.patch("/:id", teamController.updateTeam);
teamRouter.delete("/:id", teamController.deleteTeam);

/**
 * @openapi
 * /teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member
 *     description: Removes a specific member from the team. Leader only.
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
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member removed.
 *       400:
 *         description: Cannot remove leader.
 *       403:
 *         description: Forbidden.
 */
teamRouter.delete("/:id/members/:userId", teamController.removeMember);

export default teamRouter;
