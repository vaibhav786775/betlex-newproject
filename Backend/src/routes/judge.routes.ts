import { Router } from "express";
import * as judgeController from "../controllers/judge.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const judgeRouter = Router();

judgeRouter.use(authMiddleware);

/**
 * @openapi
 * /judge/projects:
 *   get:
 *     summary: List assigned projects
 *     description: Retrieve all projects assigned to the current judge for scoring. Judge/Admin only.
 *     tags:
 *       - Judging
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned projects list retrieved.
 *       403:
 *         description: Forbidden.
 */
judgeRouter.get(
  "/projects",
  roleMiddleware("judge", "admin"),
  judgeController.getAssignedProjects
);

/**
 * @openapi
 * /judge/projects/{id}:
 *   get:
 *     summary: Get project for judge
 *     description: Retrieve detailed project information with existing score if scored previously. Judge/Admin only.
 *     tags:
 *       - Judging
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
 *         description: Project details.
 *       403:
 *         description: Forbidden.
 */
judgeRouter.get(
  "/projects/:id",
  roleMiddleware("judge", "admin"),
  judgeController.getProjectForJudge
);

/**
 * @openapi
 * /judge/projects/{id}/score:
 *   post:
 *     summary: Submit project score
 *     description: Submit score parameters (1-10) for 4 criteria. Judge only.
 *     tags:
 *       - Judging
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
 *               - innovation
 *               - technical
 *               - impact
 *               - presentation
 *             properties:
 *               innovation:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 9
 *               technical:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 8
 *               impact:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 9
 *               presentation:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 7
 *               comments:
 *                 type: string
 *                 example: Great technical design!
 *     responses:
 *       200:
 *         description: Score submitted successfully.
 *       400:
 *         description: Scores out of range.
 *       403:
 *         description: Forbidden.
 *   patch:
 *     summary: Update project score
 *     description: Update criteria scores. Judge only.
 *     tags:
 *       - Judging
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
 *               innovation:
 *                 type: integer
 *               technical:
 *                 type: integer
 *               impact:
 *                 type: integer
 *               presentation:
 *                 type: integer
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Score updated.
 */
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

/**
 * @openapi
 * /judge/events/{id}/scores:
 *   get:
 *     summary: Get all scores for an event
 *     description: Retrieve all score listings grouped by project. Organizer/Admin only.
 *     tags:
 *       - Judging
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
 *         description: Scores retrieved successfully.
 *       403:
 *         description: Forbidden.
 */
judgeRouter.get(
  "/events/:id/scores",
  roleMiddleware("organizer", "admin"),
  judgeController.getEventScores
);

export default judgeRouter;
