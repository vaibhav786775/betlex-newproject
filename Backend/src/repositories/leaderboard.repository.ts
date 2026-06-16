import prisma from "../config/prisma";

export const getLeaderboardData = async (eventId: string) => {
  const result: any[] = await prisma.$queryRaw`
    SELECT 
      p.id AS "projectId",
      p.title AS "projectTitle",
      t.name AS "teamName",
      COALESCE(AVG(s.total), 0) AS "averageScore",
      p.submitted_at AS "submittedAt"
    FROM projects p
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN scores s ON p.id = s.project_id
    WHERE p.event_id = ${eventId} AND p.status = 'submitted'
    GROUP BY p.id, t.name
    ORDER BY "averageScore" DESC, p.submitted_at ASC
  `;

  return result.map((item, index) => ({
    rank: index + 1,
    projectId: item.projectId,
    projectTitle: item.projectTitle,
    teamName: item.teamName,
    averageScore: Number(item.averageScore),
    submittedAt: item.submittedAt
  }));
};

export const getEventPublicationStatus = async (eventId: string) => {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { isLeaderboardPublished: true, organizerId: true }
  });
};
