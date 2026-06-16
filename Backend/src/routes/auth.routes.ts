import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limit.middleware";

const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with role participant, organizer, judge or admin.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dev@beetlex.com
 *               password:
 *                 type: string
 *                 example: "SecurePass123!"
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               role:
 *                 type: string
 *                 enum: [participant, judge, organizer, admin]
 *                 example: participant
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Validation error.
 *       409:
 *         description: Email or username already exists.
 */
authRouter.post("/register", authLimiter, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns an access token in body and refresh token in HttpOnly cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dev@beetlex.com
 *               password:
 *                 type: string
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login successful.
 *       401:
 *         description: Invalid credentials.
 */
authRouter.post("/login", authLimiter, authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Retrieves the profile details of the authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully.
 *       401:
 *         description: Unauthorized.
 *   patch:
 *     summary: Update profile
 *     description: Updates current user profile details (fullName, bio, URLs).
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Jane Doe
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: Hackathon enthusiast.
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://cdn.com/avatar.png
 *               githubUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://github.com/johndoe
 *               linkedinUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://linkedin.com/in/johndoe
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 */
authRouter.get("/me", authMiddleware, authController.me);
authRouter.patch("/me", authMiddleware, authController.updateProfile);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh token rotation
 *     description: Generates a new access token and rotates the refresh token.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Access token refreshed.
 *       401:
 *         description: Invalid or expired refresh token.
 */
authRouter.post("/refresh", authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out user
 *     description: Invalidates active refresh token and clears auth cookies.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully.
 */
authRouter.post("/logout", authController.logout);

export default authRouter;

