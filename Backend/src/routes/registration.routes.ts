import { Router } from "express";
import * as registrationController from "../controllers/registration.controller";
import authMiddleware from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const registrationRouter = Router({ mergeParams: true });

registrationRouter.use(authMiddleware);

registrationRouter.post("/register", registrationController.register);
registrationRouter.get("/registration", registrationController.getRegistration);
registrationRouter.delete("/registration", registrationController.deleteRegistration);

registrationRouter.get(
  "/registrations",
  roleMiddleware("organizer", "admin"),
  registrationController.getRegistrations
);

export default registrationRouter;
