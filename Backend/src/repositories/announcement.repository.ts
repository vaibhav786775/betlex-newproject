import prisma from "../config/prisma";

export const createAnnouncement = async (data: any) => {
  return prisma.announcement.create({
    data
  });
};

export const findAnnouncementById = async (id: string) => {
  return prisma.announcement.findUnique({
    where: { id },
    include: { event: true }
  });
};

export const updateAnnouncement = async (id: string, data: any) => {
  return prisma.announcement.update({
    where: { id },
    data
  });
};

export const findAnnouncementsByEvent = async (eventId: string, target?: any) => {
  return prisma.announcement.findMany({
    where: {
      eventId,
      isPublished: true,
      ...(target && { target: { in: [target, 'all'] } })
    },
    orderBy: { publishedAt: 'desc' }
  });
};

export const markAsRead = async (announcementId: string, userId: string) => {
  return prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId
      }
    },
    create: {
      announcementId,
      userId
    },
    update: {
      readAt: new Date()
    }
  });
};

export const getUnreadCount = async (userId: string, eventId: string) => {
  // Count published announcements for this event that the user hasn't read
  return prisma.announcement.count({
    where: {
      eventId,
      isPublished: true,
      reads: {
        none: {
          userId
        }
      }
    }
  });
};
