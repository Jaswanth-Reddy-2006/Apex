import { createMiddleware } from "@tanstack/react-start";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { getRequest } from "../shims/react-start-server.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_please_change_in_production";

export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    try {
      const request = getRequest();
      if (!request) {
        throw new Error("Unauthorized: Request context missing");
      }
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized: No authorization header provided");
      }

      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      if (!decoded.userId) {
        throw new Error("Unauthorized: Invalid token payload");
      }

      return next({
        context: {
          userId: decoded.userId,
          prisma: prisma,
        },
      });
    } catch (error: any) {
      console.error("[Auth Middleware] Error:", error.message);
      throw new Error(`Unauthorized: ${error.message}`);
    }
  }
);
