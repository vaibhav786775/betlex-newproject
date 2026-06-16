import { Response } from "express";
import * as registrationService from "../services/registration.service";
import { createRegistrationSchema } from "../validators/registration.schema";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const register = asyncHandler(async (req: any, res: Response) => {
  const data = createRegistrationSchema.parse(req.body);
  const registration = await registrationService.registerForEvent(
    req.user.id,
    req.params.id,
    data
  );
  sendSuccess(res, registration, "Registered successfully", 201);
});

export const getRegistration = asyncHandler(async (req: any, res: Response) => {
  const registration = await registrationService.getUserRegistration(
    req.user.id,
    req.params.id
  );
  sendSuccess(res, registration, "Registration fetched successfully");
});

export const deleteRegistration = asyncHandler(async (req: any, res: Response) => {
  await registrationService.cancelRegistration(req.user.id, req.params.id);
  sendSuccess(res, null, "Registration cancelled successfully");
});

export const getRegistrations = asyncHandler(async (req: any, res: Response) => {
  const registrations: any = await registrationService.getEventRegistrations(
    req.user.id,
    req.user.role,
    req.params.id,
    req.query
  );

  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-${req.params.id}.csv`);
    
    let csv = 'ID,User_ID,Status,Registered_At\n';
    registrations.results.forEach((r: any) => {
      csv += `${r.id},${r.userId},${r.status},${r.registeredAt}\n`;
    });
    
    return res.send(csv);
  }

  sendSuccess(res, registrations, "Registrations fetched successfully");
});

