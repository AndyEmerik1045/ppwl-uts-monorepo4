import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { cookie } from "@elysiajs/cookie";
import { prisma } from "../prisma/db";
import { createOAuthClient, getAuthUrl } from "./auth";
import { getCourses, getCourseWorks, getSubmissions } from "./classroom";
import type { ApiResponse, HealthCheck, User } from "shared";
import fs from "fs";
import path from "path";

// Simpan token (Ingat: Di Vercel ini akan reset setiap fungsi idle/dingin)
const tokenStore = new Map<string, { access_token: string; refresh_token?: string }>();

const app = new Elysia()
  // 1. PERBAIKAN CORS: Tambahkan credentials & allowedMethods
  .use(
    cors({
      origin: [
        (process.env.FRONTEND_URL ?? "").replace(/\/$/, ""), // Hapus trailing slash
        (process.env.TEST_URL ?? "").replace(/\/$/, ""),
        "http://localhost:5173",
      ],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  )
  // 2. PERBAIKAN KEAMANAN: Jangan blokir frontend sendiri
  .onRequest(({ request, set }) => {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith("/users")) {
      const origin = request.headers.get("origin")?.replace(/\/$/, "");
      const frontendUrl = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
      const key = url.searchParams.get("key");

      // IZINKAN jika: Datang dari Frontend resmi ATAU punya API_KEY yang benar
      const isFromFrontend = origin && origin === frontendUrl;
      const hasValidKey = key === (process.env.API_KEY || "learn");

      if (!isFromFrontend && !hasValidKey) {
        set.status = 401;
        return { message: "Unauthorized: Invalid Origin or Missing API Key" };
      }
    }
  })
  .use(swagger())
  .use(cookie())

  // --- ROUTES ---

  .get("/", (): ApiResponse<HealthCheck> => ({
    data: { status: "ok" },
    message: "server running",
  }))

  .get("/users", async () => {
    const users = await prisma.user.findMany();
    return {
      data: users,
      message: "User list retrieved",
    } as ApiResponse<User[]>;
  })

  // --- AUTH ROUTES ---

  .get("/auth/login", ({ redirect }) => {
    const oauth2Client = createOAuthClient();
    return redirect(getAuthUrl(oauth2Client));
  })

  .get("/auth/callback", async ({ query, set, cookie: { session }, redirect }) => {
    const { code } = query as { code: string };
    if (!code) {
      set.status = 400;
      return { error: "Missing authorization code" };
    }

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    const sessionId = crypto.randomUUID();
    tokenStore.set(sessionId, {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? undefined,
    });

    if (session) {
      session.value = sessionId;
      session.maxAge = 60 * 60 * 24;
      session.httpOnly = true;
      session.sameSite = "none"; // Penting untuk cross-domain Vercel
      session.secure = true;
    }

    // Gunakan FRONTEND_URL dari env
    return redirect(`${process.env.FRONTEND_URL}/classroom`);
  })

  .get("/auth/me", ({ cookie: { session } }) => {
    const sessionId = session?.value as string;
    if (!sessionId || !tokenStore.has(sessionId)) return { loggedIn: false };
    return { loggedIn: true, sessionId };
  })

  .post("/auth/logout", ({ cookie: { session } }) => {
    const sessionId = session?.value as string;
    if (sessionId) {
      tokenStore.delete(sessionId);
      if (session) {
      session.remove();
      }
    }
    return { success: true };
  })

  // --- CLASSROOM ROUTES ---

  .get("/classroom/courses", async ({ cookie: { session }, set }) => {
    const sessionId = session?.value as string;
    const tokens = sessionId ? tokenStore.get(sessionId) : null;
    if (!tokens) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const courses = await getCourses(tokens.access_token);
    return { data: courses, message: "Courses retrieved" };
  })

  .get("/classroom/courses/:courseId/submissions", async ({ params, cookie: { session }, set }) => {
    const sessionId = session?.value as string;
    const tokens = sessionId ? tokenStore.get(sessionId) : null;
    if (!tokens) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { courseId } = params;
    const [courseWorks, submissions] = await Promise.all([
      getCourseWorks(tokens.access_token, courseId),
      getSubmissions(tokens.access_token, courseId),
    ]);

    const submissionMap = new Map(submissions.map((s) => [s.courseWorkId, s]));
    const result = courseWorks.map((cw) => ({
      courseWork: cw,
      submission: submissionMap.get(cw.id) ?? null,
    }));

    return { data: result, message: "Course submissions retrieved" };
  })

  .get("/debug-prisma", () => {
    const generatedPath = path.resolve(__dirname, "../src/generated/prisma/client");
    const exists = fs.existsSync(generatedPath);
    return {
      path: generatedPath,
      exists: exists,
      files: exists ? fs.readdirSync(generatedPath) : []
    };
  });

// Konfigurasi Server
if (process.env.NODE_ENV !== "production") {
  app.listen(3000);
  console.log(`🦊 Backend running at http://localhost:3000`);
}

export default app;
export type App = typeof app;

//finish