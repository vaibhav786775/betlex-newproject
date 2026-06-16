import { Request, Response } from "express";
import * as announcementService from "../services/announcement.service";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const createAnnouncement = asyncHandler(async (req: any, res: Response) => {
  const ann = await announcementService.createAnnouncement(req.user.id, req.params.id, req.body);
  sendSuccess(res, ann, "Announcement draft created", 201);
});

export const publishAnnouncement = asyncHandler(async (req: any, res: Response) => {
  const ann = await announcementService.publishAnnouncement(req.user.id, req.params.annId);
  sendSuccess(res, ann, "Announcement published and broadcasted");
});

export const getAnnouncements = asyncHandler(async (req: any, res: Response) => {
  const anns = await announcementService.getAnnouncements(req.params.id, req.user.role);
  sendSuccess(res, anns, "Announcements fetched");
});

export const markRead = asyncHandler(async (req: any, res: Response) => {
  await announcementService.markRead(req.user.id, req.params.annId);
  sendSuccess(res, null, "Marked as read");
});

export const getUnreadCount = asyncHandler(async (req: any, res: Response) => {
  const count = await announcementService.getUnreadCount(req.user.id, req.params.id);
  sendSuccess(res, { count }, "Unread count fetched");
});

export const listenToAnnouncements = (req: Request, res: Response) => {
  const eventId = req.params.id;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  const unsubscribe = announcementService.subscribeToAnnouncements(eventId as string, (ann) => {

    res.write(`data: ${JSON.stringify(ann)}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
};
