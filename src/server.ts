// src/server.ts
import express, {
  Application,
  Request,
  Response,
  NextFunction,
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
 * Libera:
 * - localhost (dev)
 * - domínio de produção da Vercel
 * - qualquer preview *.vercel.app
 * - responde aos preflights (OPTIONS)
 */
const ALLOWED_LIST = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// sempre garantir os básicos
if (!ALLOWED_LIST.includes("http://localhost:5173")) {
  ALLOWED_LIST.push("http://localhost:5173");
}
if (!ALLOWED_LIST.includes("https://jackpot-frontend-three.vercel.app")) {
  ALLOWED_LIST.push("https://jackpot-frontend-three.vercel.app"); // sem barra no final
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // requests sem Origin (curl/health)

    // libera qualquer preview da Vercel
    if (/\.vercel\.app$/i.test(origin)) return callback(null, true);

    if (ALLOWED_LIST.includes(origin)) return callback(null, true);

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // cache do preflight
};

// CORS + preflight
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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

// 🔧 Middleware de erro (tipado corretamente)
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
