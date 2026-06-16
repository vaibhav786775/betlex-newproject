import prisma from "../config/prisma";

export const getLeaderboardData = async (eventId: string) => {
  const projects = await prisma.project.findMany({
    where: { 
      eventId,
      status: 'submitted'
    },
    include: {
      team: {
        select: { name: true }
      },
      scores: true
    }
  });

  // Calculate averages and sort
  const leaderboard = projects.map(project => {
    const totalScoreSum = project.scores.reduce((acc, score) => acc + score.total, 0);
    const averageScore = project.scores.length > 0 ? totalScoreSum / project.scores.length : 0;
    
    return {
      projectId: project.id,
      projectTitle: project.title,
      teamName: project.team.name,
      averageScore,
      submittedAt: project.submittedAt
    };
  });

  // Ranking logic: averageScore DESC, submittedAt ASC (tie breaking)
  leaderboard.sort((a, b) => {
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    // Tie break: earlier submission wins
    const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
    const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
    return dateA - dateB;
  });

  // Add rank
  return leaderboard.map((item, index) => ({
    rank: index + 1,
    ...item
  }));
};

export const getEventPublicationStatus = async (eventId: string) => {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { isLeaderboardPublished: true, organizerId: true }
  });
};
