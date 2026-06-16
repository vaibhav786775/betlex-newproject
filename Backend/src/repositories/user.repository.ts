import prisma from "../config/prisma";
import { User } from "../../generated/prisma/client";

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserByUsername = async (
  username: string
): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const findUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const createUser = async (data: {
  email: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role?: "participant" | "judge" | "organizer" | "admin";
}): Promise<User> => {
  return prisma.user.create({
    data,
  });
};

export const updateUser = async (
  id: string,
  data: Partial<{
    email: string;
    username: string;
    passwordHash: string;
    fullName: string;
    avatarUrl: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    bio: string | null;
    role: "participant" | "judge" | "organizer" | "admin";
    isVerified: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
  }>
): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

