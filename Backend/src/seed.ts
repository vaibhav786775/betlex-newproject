import dotenv from "dotenv";
dotenv.config();

import prisma from "./config/prisma";
import { hashPassword } from "./utils/password";

async function main() {
  // Clean up
  await prisma.refreshToken.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.eventJudge.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  const passHash = await hashPassword("Password123!");

  // Create Organizer
  const organizer = await prisma.user.create({
    data: {
      email: "org@beetlex.com",
      passwordHash: passHash,
      fullName: "Main Organizer",
      username: "organizer",
      role: "organizer",
    }
  });

  // Create Judge
  const judge = await prisma.user.create({
    data: {
      email: "judge@beetlex.com",
      passwordHash: passHash,
      fullName: "Main Judge",
      username: "judge",
      role: "judge",
    }
  });

  // Create Participant
  const participant = await prisma.user.create({
    data: {
      email: "part@beetlex.com",
      passwordHash: passHash,
      fullName: "Main Participant",
      username: "participant",
      role: "participant",
    }
  });

  // Create Event
  const event = await prisma.event.create({
    data: {
      title: "BeetleX Winter Hackathon",
      description: "Code the best Web/AI apps for extreme optimization.",
      slug: "beetlex-winter",
      registrationOpen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      registrationClose: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      eventStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      eventEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      submissionDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: "Asia/Kolkata",
      prizePool: { first: "$10000" },
      tags: ["express", "prisma", "react"],
      maxTeamSize: 4,
      minTeamSize: 1,
      organizerId: organizer.id,
      isPublic: true,
    }
  });

  // Assign Judge to Event
  await prisma.eventJudge.create({
    data: {
      eventId: event.id,
      judgeId: judge.id,
      assignedBy: organizer.id,
    }
  });

  // Register Participant
  const reg = await prisma.registration.create({
    data: {
      eventId: event.id,
      userId: participant.id,
      registrationData: { skills: ["TypeScript", "Next.js"] },
      status: "confirmed"
    }
  });

  // Create Team
  const team = await prisma.team.create({
    data: {
      eventId: event.id,
      name: "Alpha Coders",
      inviteCode: "ALPHACODE",
      leaderId: participant.id,
      track: "AI",
    }
  });

  // Update Registration with teamId
  await prisma.registration.update({
    where: { id: reg.id },
    data: { teamId: team.id }
  });

  // Add Member to Team
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: participant.id,
      role: "leader"
    }
  });

  // Create and Submit Project
  await prisma.project.create({
    data: {
      eventId: event.id,
      teamId: team.id,
      title: "BeetleX Agent Pro",
      description: "An AI-powered editor plugin that fixes bugs in seconds.",
      techStack: ["React", "Express", "Prisma"],
      status: "submitted",
      submittedAt: new Date(),
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
