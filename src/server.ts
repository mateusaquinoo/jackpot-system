// src/server.ts
import express, {
  Application,
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";

import entradaRoutes from "./routes/entradas";
import jackpotRoutes from "./routes/jackpot";
import saidasRoutes from "./routes/saidas";
import eventosRoutes from "./routes/eventos";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

/**
 * 🔐 CORS CONFIGURAÇÃO COMPLETA
 * - localhost (dev)
 * - domínio de produção da Vercel
 * - qualquer preview *.vercel.app
 */
const ALLOWED_LIST = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// garante básicos
if (!ALLOWED_LIST.includes("http://localhost:5173")) {
  ALLOWED_LIST.push("http://localhost:5173");
}
if (!ALLOWED_LIST.includes("https://jackpot-frontend-three.vercel.app")) {
  ALLOWED_LIST.push("https://jackpot-frontend-three.vercel.app"); // sem barra final
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // chamadas internas (sem Origin) ok
    if (!origin) return callback(null, true);

    // libera qualquer preview da Vercel
    if (/\.vercel\.app$/i.test(origin)) return callback(null, true);

    // libera explicitamente os da lista
    if (ALLOWED_LIST.includes(origin)) return callback(null, true);

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

// aplica CORS global
app.use(cors(corsOptions));

// preflight OPTIONS sem retornar Response (tipado)
const preflight: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === "OPTIONS") {
    // CORS já setou os headers; apenas finalize a requisição.
    res.status(204).end();
    return;
  }
  next();
};
app.use(preflight);

app.use(express.json());

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.send("🟢 API Jackpot rodando!");
});

// Rotas
app.use("/entradas", entradaRoutes);
app.use("/jackpot", jackpotRoutes);
app.use("/saidas", saidasRoutes);
app.use("/eventos", eventosRoutes);

// Middleware de erro (tipado) — não retorna Response
const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err?.message?.startsWith("Not allowed by CORS")) {
    console.error("CORS bloqueado:", err.message);
    res.status(403).json({ error: err.message });
    return;
  }
  console.error("Erro inesperado:", err);
  res.status(500).json({ error: "Erro interno no servidor" });
};
app.use(errorHandler);

// start
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
