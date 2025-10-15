// src/server.ts
import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";

import entradaRoutes from "./routes/entradas";
import jackpotRoutes from "./routes/jackpot";
import saidasRoutes from "./routes/saidas";
import eventosRoutes from "./routes/eventos";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

/**
 * 🔐 CORS
 * Liste aqui todos os domínios que podem acessar a API.
 * Inclua o domínio do seu site da Vercel (sem barra no final).
 */
const allowedOrigins = [
  "http://localhost:5173",                  // Front local (dev)
  "https://jackpot-frontend.vercel.app"     // 🔸 troque pelo domínio real do seu front Vercel
];

// Middleware CORS configurado
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Middleware padrão para JSON
app.use(express.json());

// Health Check simples
app.get("/", (_req, res) => {
  res.send("🟢 API Jackpot rodando!");
});

// Rotas principais
app.use("/entradas", entradaRoutes);
app.use("/jackpot", jackpotRoutes);
app.use("/saidas", saidasRoutes);
app.use("/eventos", eventosRoutes);

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
