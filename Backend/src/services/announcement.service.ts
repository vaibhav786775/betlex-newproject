import * as announcementRepository from "../repositories/announcement.repository";
import { AppError } from "../utils/app-error";
import { EventEmitter } from "events";

const announcementEvents = new EventEmitter();

export const createAnnouncement = async (userId: string, eventId: string, data: any) => {
  return announcementRepository.createAnnouncement({
    ...data,
    authorId: userId,
    eventId: eventId
  });
};

export const publishAnnouncement = async (userId: string, annId: string) => {
  const ann = await announcementRepository.findAnnouncementById(annId);
  if (!ann) throw new AppError("Announcement not found", 404, "NOT_FOUND");
  
  if (ann.authorId !== userId) {
    throw new AppError("Unauthorized", 403, "FORBIDDEN");
  }

  const updated = await announcementRepository.updateAnnouncement(annId, {
    isPublished: true,
    publishedAt: new Date()
  });

  // Broadcast
  announcementEvents.emit(`broadcast:${ann.eventId}`, updated);

  return updated;
};

export const getAnnouncements = async (eventId: string, userRole: string) => {
  let target: any = 'participants';
  if (userRole === 'judge') target = 'judges';
  if (userRole === 'organizer' || userRole === 'admin') target = 'organizers';

  return announcementRepository.findAnnouncementsByEvent(eventId, target);
};

export const markRead = async (userId: string, annId: string) => {
  return announcementRepository.markAsRead(annId, userId);
};

export const getUnreadCount = async (userId: string, eventId: string) => {
  return announcementRepository.getUnreadCount(userId, eventId);
};

export const subscribeToAnnouncements = (eventId: string, callback: (ann: any) => void) => {
  const handler = (ann: any) => callback(ann);
  announcementEvents.on(`broadcast:${eventId}`, handler);
  return () => announcementEvents.off(`broadcast:${eventId}`, handler);
};
