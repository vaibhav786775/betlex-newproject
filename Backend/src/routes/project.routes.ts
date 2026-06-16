import { Router } from "express";
import * as projectController from "../controllers/project.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const projectRouter = Router();

projectRouter.use(authMiddleware);

/**
 * @openapi
 * /teams/{id}/project:
 *   post:
 *     summary: Create project draft
 *     description: Creates a new project draft for a team. Limit one project per team.
 *     tags:
 *       - Projects
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
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: My Awesome Hackathon Project
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: A project description under 2000 chars.
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["react", "nodejs", "prisma"]
 *     responses:
 *       201:
 *         description: Project draft created.
 *       409:
 *         description: Project already exists for this team.
 *   get:
 *     summary: Get team project
 *     description: Retrieves the current project details for a specific team.
 *     tags:
 *       - Projects
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
 *       404:
 *         description: Project not found.
 *   patch:
 *     summary: Update project draft
 *     description: Updates fields of a team's project draft. Sanitized to prevent status/ID changes.
 *     tags:
 *       - Projects
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
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *               demoUrl:
 *                 type: string
 *               repoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated.
 *       403:
 *         description: Forbidden.
 */
projectRouter.post("/teams/:id/project", projectController.createProject);
projectRouter.get("/teams/:id/project", projectController.getProject);
projectRouter.patch("/teams/:id/project", projectController.updateProject);

/**
 * @openapi
 * /teams/{id}/project/submit:
 *   post:
 *     summary: Submit project
 *     description: Finalizes submission. Validates deadline. Leader only.
 *     tags:
 *       - Projects
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
 *         description: Project submitted.
 *       400:
 *         description: Deadline passed.
 */
projectRouter.post("/teams/:id/project/submit", projectController.submitProject);

/**
 * @openapi
 * /teams/{id}/project/deck:
 *   post:
 *     summary: Upload pitch deck
 *     description: Uploads a pitch deck PDF (max 10MB) and returns public CDN/S3 URL.
 *     tags:
 *       - Projects
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
 *         description: Pitch deck uploaded successfully.
 */
projectRouter.post("/teams/:id/project/deck", projectController.uploadDeck);

/**
 * @openapi
 * /events/{id}/projects:
 *   get:
 *     summary: List event projects
 *     description: Retrieve all submitted projects for an event. Organizers and assigned Judges only.
 *     tags:
 *       - Projects
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
 *         description: Projects list.
 *       403:
 *         description: Forbidden.
 */
projectRouter.get(
  "/events/:id/projects",
  roleMiddleware("organizer", "admin", "judge"),
  projectController.getEventProjects
);

export default projectRouter;