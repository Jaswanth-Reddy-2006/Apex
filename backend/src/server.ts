// Apex Backend Server - Connected to MongoDB via Prisma ORM
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requestStorage, getRequest } from "./shims/react-start-server.js";
import { seedDefaultRolesAndPermissions } from "./lib/seed.js";

// Load environment variables from backend/ .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import * as apiFunctions from "./services/api.functions.js";
import * as chatFunctions from "./services/chat.functions.js";
import * as authFunctions from "./services/auth.functions.js";
import * as autonomousFunctions from "./services/autonomous.functions.js";
import * as paymentsFunctions from "./services/payments.functions.js";
import { Route as chatApiRoute } from "./routes/api/chat.js";

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === "null") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup request context middleware for server functions
app.use((req, res, next) => {
  const protocol = req.protocol;
  const host = req.get("host");
  const fullUrl = `${protocol}://${host}${req.originalUrl}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const body = req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : null;

  const webRequest = new Request(fullUrl, {
    method: req.method,
    headers,
    body,
  });

  requestStorage.run(webRequest, () => {
    next();
  });
});

// Dynamic endpoint mapping for RPC server functions
const allFunctions: Record<string, any> = {
  ...apiFunctions,
  ...chatFunctions,
  ...authFunctions,
  ...autonomousFunctions,
  ...paymentsFunctions,
};

app.all("/api/functions/:name", async (req, res) => {
  const { name } = req.params;
  const fn = allFunctions[name];

  if (!fn || typeof fn !== "function") {
    return res.status(404).json({ error: `Function ${name} not found` });
  }

  try {
    // Determine input
    let input: any;
    if (req.method === "GET" || req.method === "HEAD") {
      if (req.query._input) {
        try {
          input = JSON.parse(req.query._input as string);
        } catch {
          input = { data: req.query };
        }
      } else {
        input = { data: req.query };
      }
    } else {
      input = req.body;
    }

    // Call the function
    const result = await fn(input);
    res.json(result);
  } catch (err: any) {
    console.error(`Error in function ${name}:`, err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Custom AI chat streaming route
app.post("/api/chat", async (req, res) => {
  try {
    const handler = (chatApiRoute as any).options?.server?.handlers?.POST;
    if (!handler) {
      return res.status(500).json({ error: "Chat handler not found" });
    }

    const webRequest = getRequest();
    if (!webRequest) {
      return res.status(500).json({ error: "Web request context missing" });
    }

    // Run the TanStack-style Route handler in our request storage context
    const response: Response = await handler({ request: webRequest });

    // Stream the Fetch Response to Express response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(response.status);

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal Server Error" });
    } else {
      res.end();
    }
  }
});

// Seed default system roles and permissions
seedDefaultRolesAndPermissions();

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
