import prisma from "../config/prisma";

export const createRefreshToken = async (token: string, userId: string, expiresAt: Date) => {
  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
};

export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
};

export const deleteRefreshToken = async (token: string) => {
  return prisma.refreshToken.deleteMany({
    where: { token },
  });
};

export const deleteUserRefreshTokens = async (userId: string) => {
  return prisma.refreshToken.deleteMany({
    where: { userId },
  });
};
