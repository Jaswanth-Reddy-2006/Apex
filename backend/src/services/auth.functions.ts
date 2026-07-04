import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth } from "../lib/auth-middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_please_change_in_production";

export const signup = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      fullName: z.string().optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    // Requires instantiating Prisma since it's not authenticated route
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const existing = await prisma.user.findUnique({ where: { email: data.email }});
    if (existing) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        Profile: {
          create: {
            email: data.email,
            full_name: data.fullName ?? "",
          }
        }
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return { token, user: { id: user.id, email: user.email } };
  });

export const login = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({ where: { email: data.email }});
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return { token, user: { id: user.id, email: user.email } };
  });

export const me = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const user = await context.prisma.user.findUnique({
      where: { id: context.userId },
      include: { Profile: true }
    });
    if (!user) throw new Error("User not found");
    return { id: user.id, email: user.email, profile: user.Profile };
  });
