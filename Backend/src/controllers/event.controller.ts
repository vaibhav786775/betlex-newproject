import { Request, Response } from "express";
import * as eventService from "../services/event.service";
import { createEventSchema } from "../validators/create-event.schema";
import { updateEventSchema } from "../validators/update-event.schema";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const createEvent = asyncHandler(async (req: any, res: Response) => {
  const data = createEventSchema.parse(req.body);
  const event = await eventService.createEvent(req.user.id, data);
  sendSuccess(res, event, "Event created successfully", 201);
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await eventService.getEvents(req.query as any);
  sendSuccess(res, events, "Events fetched successfully");
});

export const getEventBySlug = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventService.getEventBySlug(req.params.slug as string);
  sendSuccess(res, event, "Event fetched successfully");
});

export const updateEvent = asyncHandler(async (req: any, res: Response) => {
  const data = updateEventSchema.parse(req.body);
  const event = await eventService.updateEvent(
    req.user.id,
    req.user.role,
    req.params.id,
    data
  );
  sendSuccess(res, event, "Event updated successfully");
});

export const deleteEvent = asyncHandler(async (req: any, res: Response) => {
  await eventService.deleteEvent(req.user.role, req.params.id);
  sendSuccess(res, null, "Event deleted successfully");
});

export const getEventStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await eventService.getEventStats(req.params.id as string);
  sendSuccess(res, stats, "Event stats fetched successfully");
});
