import { AppError } from "../utils/app-error";
import { hashPassword, comparePassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import * as userRepository from "../repositories/user.repository";
import * as refreshTokenRepository from "../repositories/refresh-token.repository";
import { User } from "../../generated/prisma/client";

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  username: string;
  role?: "participant" | "judge" | "organizer" | "admin";
}

interface LoginInput {
  email: string;
  password: string;
}

interface UserResponse extends Omit<User, "passwordHash"> {}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export const register = async (input: RegisterInput): Promise<UserResponse> => {
  const existingUserByEmail = await userRepository.findUserByEmail(
    input.email
  );
  if (existingUserByEmail) {
    throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
  }

  const existingUserByUsername = await userRepository.findUserByUsername(
    input.username
  );
  if (existingUserByUsername) {
    throw new AppError("Username already exists", 409, "USERNAME_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await userRepository.createUser({
    email: input.email,
    username: input.username,
    fullName: input.fullName,
    passwordHash,
    role: input.role,
  });

  const { passwordHash: _, ...userResponse } = user;
  return userResponse;
};

export const login = async (input: LoginInput): Promise<LoginResponse> => {
  const user = await userRepository.findUserByEmail(input.email);
  if (!user) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await refreshTokenRepository.createRefreshToken(refreshToken, user.id, expiresAt);

  const { passwordHash: _, ...userResponse } = user;
  return {
    accessToken,
    refreshToken,
    user: userResponse,
  };
};

export const getMe = async (userId: string): Promise<UserResponse> => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  const { passwordHash: _, ...userResponse } = user;
  return userResponse;
};

export const refresh = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400, "REFRESH_TOKEN_REQUIRED");
  }

  try {
    const payload = (await import("../utils/jwt")).verifyRefreshToken(refreshToken);
    const userId = payload.userId;

    const tokenRecord = await refreshTokenRepository.findRefreshToken(refreshToken);
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    // Invalidate the old refresh token (rotate)
    await refreshTokenRepository.deleteRefreshToken(refreshToken);

    const user = tokenRecord.user;
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await refreshTokenRepository.createRefreshToken(newRefreshToken, user.id, expiresAt);

    const { passwordHash: _, ...userResponse } = user;
    return { accessToken, refreshToken: newRefreshToken, user: userResponse };
  } catch (err) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }
};

export const logout = async (refreshToken?: string): Promise<void> => {
  if (refreshToken) {
    await refreshTokenRepository.deleteRefreshToken(refreshToken);
  }
};

export const updateProfile = async (userId: string, data: any): Promise<UserResponse> => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  const updated = await userRepository.updateUser(userId, {
    fullName: data.fullName,
    bio: data.bio,
    avatarUrl: data.avatarUrl,
    githubUrl: data.githubUrl,
    linkedinUrl: data.linkedinUrl,
  });
  const { passwordHash: _, ...userResponse } = updated;
  return userResponse;
};
