/// <reference types="jest" />
import request from "supertest";
import app from "../app";
import prisma from "../config/prisma";
import { hashPassword } from "../utils/password";
import { generateAccessToken } from "../utils/jwt";

describe("BeetleX Backend Integration Tests", () => {
  let organizerToken: string;
  let participantToken: string;
  let participant2Token: string;
  let participant3Token: string;
  let judgeToken: string;

  let organizerId: string;
  let participantId: string;
  let participant2Id: string;
  let participant3Id: string;
  let judgeId: string;

  let testEventId: string;
  let testTeamId: string;
  let testProjectId: string;
  let inviteCode: string;

  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    // Clean up existing records from previous runs
    await prisma.refreshToken.deleteMany({});
    await prisma.score.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.eventJudge.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup password hash
    const passHash = await hashPassword("Password123!");

    // Create Organizer
    const orgUser = await prisma.user.create({
      data: {
        email: `organizer_${uniqueSuffix}@beetlex.com`,
        passwordHash: passHash,
        fullName: "Test Organizer",
        username: `organizer_${uniqueSuffix}`,
        role: "organizer",
      }
    });
    organizerId = orgUser.id;
    organizerToken = generateAccessToken(orgUser.id);

    // Create Participant 2 (joins team)
    const part2 = await prisma.user.create({
      data: {
        email: `participant2_${uniqueSuffix}@beetlex.com`,
        passwordHash: passHash,
        fullName: "Second Participant",
        username: `participant2_${uniqueSuffix}`,
        role: "participant",
      }
    });
    participant2Id = part2.id;
    participant2Token = generateAccessToken(part2.id);

    // Create Participant 3 (cancels registration)
    const part3 = await prisma.user.create({
      data: {
        email: `participant3_${uniqueSuffix}@beetlex.com`,
        passwordHash: passHash,
        fullName: "Third Participant",
        username: `participant3_${uniqueSuffix}`,
        role: "participant",
      }
    });
    participant3Id = part3.id;
    participant3Token = generateAccessToken(part3.id);

    // Create Judge
    const judgeUser = await prisma.user.create({
      data: {
        email: `judge_${uniqueSuffix}@beetlex.com`,
        passwordHash: passHash,
        fullName: "Test Judge",
        username: `judge_${uniqueSuffix}`,
        role: "judge",
      }
    });
    judgeId = judgeUser.id;
    judgeToken = generateAccessToken(judgeUser.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- AUTH SECTION ---
  
  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: `participant_${uniqueSuffix}@beetlex.com`,
        password: "Password123!",
        fullName: "Test Participant",
        username: `participant_${uniqueSuffix}`,
        role: "participant",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    participantId = res.body.data.id;
    participantToken = generateAccessToken(res.body.data.id);
  });

  it("should fail to register user with duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: `participant_${uniqueSuffix}@beetlex.com`,
        password: "Password123!",
        fullName: "Test Duplicate",
        username: `participant_dup_${uniqueSuffix}`,
      });
    expect(res.status).toBe(409);
  });

  it("should authenticate the user successfully and return access token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: `participant_${uniqueSuffix}@beetlex.com`,
        password: "Password123!",
      });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
  });

  it("should fail to login with wrong credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: `participant_${uniqueSuffix}@beetlex.com`,
        password: "WrongPassword!",
      });
    expect(res.status).toBe(401);
  });

  it("should retrieve the currently authenticated user profile details", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${participantToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(`participant_${uniqueSuffix}@beetlex.com`);
  });

  // --- EVENTS SECTION ---

  it("should allow organizer to create a new hackathon event", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "BeetleX Hackathon 2026",
        description: "Develop scalable and beautiful hackathon components.",
        slug: `beetlex-hack-${uniqueSuffix}`,
        registrationOpen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
        registrationClose: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
        eventStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        eventEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        submissionDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        timezone: "Asia/Kolkata",
        prizePool: { first: "$5000" },
        tags: ["express", "prisma", "jest"],
        maxTeamSize: 4,
        minTeamSize: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    testEventId = res.body.data.id;
  });

  it("should fetch all public hackathon events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // --- REGISTRATIONS SECTION ---

  it("should allow a participant to register for the created event", async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/register`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({
        registrationData: { skills: ["javascript", "c++"] }
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("confirmed");
  });

  it("should fail when participant registers again for the same event", async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/register`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({
        registrationData: { skills: ["javascript", "c++"] }
      });
    expect(res.status).toBe(409);
  });

  it("should allow cancellation of registration before the event start date", async () => {
    // Register Third Participant first
    await request(app)
      .post(`/api/events/${testEventId}/register`)
      .set("Authorization", `Bearer ${participant3Token}`)
      .send({
        registrationData: { skills: ["rust"] }
      });

    // Cancel Third Participant registration
    const res = await request(app)
      .delete(`/api/events/${testEventId}/registration`)
      .set("Authorization", `Bearer ${participant3Token}`);
    expect(res.status).toBe(200);

    // Register Second Participant so they stay registered and ready to join team
    await request(app)
      .post(`/api/events/${testEventId}/register`)
      .set("Authorization", `Bearer ${participant2Token}`)
      .send({
        registrationData: { skills: ["go"] }
      });
  });

  // --- TEAMS SECTION ---

  it("should allow registered participant to create a new team", async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/teams`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({
        name: `Slayer Team ${uniqueSuffix}`,
        track: "Web"
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("inviteCode");
    testTeamId = res.body.data.id;
    inviteCode = res.body.data.inviteCode;
  });

  it("should allow another participant to join the team using invite code", async () => {
    const res = await request(app)
      .post("/api/teams/join")
      .set("Authorization", `Bearer ${participant2Token}`)
      .send({ inviteCode });
    expect(res.status).toBe(200);
  });

  it("should allow team leader to remove a member from the team", async () => {
    const res = await request(app)
      .delete(`/api/teams/${testTeamId}/members/${participant2Id}`)
      .set("Authorization", `Bearer ${participantToken}`);
    expect(res.status).toBe(200);
  });

  // --- PROJECTS SECTION ---

  it("should allow team leader to create a project draft", async () => {
    const res = await request(app)
      .post(`/api/teams/${testTeamId}/project`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({
        title: "Hackathon Tracker",
        description: "Allows users to inspect submissions easily.",
        techStack: ["React", "Express"],
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    testProjectId = res.body.data.id;
  });

  it("should allow team leader to submit project before deadline", async () => {
    const res = await request(app)
      .post(`/api/teams/${testTeamId}/project/submit`)
      .set("Authorization", `Bearer ${participantToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("submitted");
  });

  // --- JUDGING SECTION ---

  it("should allow assigned judge to submit score for project", async () => {
    // Assign judge to event first
    await prisma.eventJudge.create({
      data: {
        eventId: testEventId,
        judgeId: judgeId,
        assignedBy: organizerId,
      }
    });

    const res = await request(app)
      .post(`/api/judge/projects/${testProjectId}/score`)
      .set("Authorization", `Bearer ${judgeToken}`)
      .send({
        innovation: 8,
        technical: 9,
        impact: 8,
        presentation: 9,
        comments: "Excellent submission!",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(8.5); // (8+9+8+9)/4
  });

  it("should allow judge to update submitted project score", async () => {
    const res = await request(app)
      .patch(`/api/judge/projects/${testProjectId}/score`)
      .set("Authorization", `Bearer ${judgeToken}`)
      .send({
        innovation: 10,
        technical: 10,
        impact: 10,
        presentation: 10,
        comments: "Perfection!",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(10);
  });
});
