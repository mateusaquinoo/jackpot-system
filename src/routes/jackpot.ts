// src/routes/jackpot.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /jackpot/atual
 * Retorna a soma do jackpot por Sede e Modalidade.
 * Exemplo:
 * [
 *   { sede: "Alphaville", modalidade: "Texas", jackpot: 1234.56 },
 *   { sede: "Alphaville", modalidade: "Omaha", jackpot: 789.01 },
 *   { sede: "Jd. América", modalidade: "Texas", jackpot: ... },
 *   ...
 * ]
 */
router.get("/atual", async (_req: Request, res: Response): Promise<void> => {
  try {
    // Busca entradas e saídas já com o nome da sede
    const [entradas, saidas] = await Promise.all([
      prisma.entrada.findMany({ include: { sede: true } }),
      prisma.saida.findMany({ include: { sede: true } }),
    ]);

    // Agrega por (sedeId + modalidade)
    type Key = string;
    const agg: Record<
      Key,
      { sedeId: number; sedeNome: string; modalidade: "Texas" | "Omaha" | string; valor: number }
    > = {};

    // Soma dos valores que entram no jackpot
    for (const e of entradas) {
      const sedeId = e.sedeId;
      const sedeNome = e.sede?.nome ?? "";
      const modalidade = e.modalidade === "Omaha" ? "Omaha" : "Texas";
      const key = `${sedeId}::${modalidade}`;

      if (!agg[key]) {
        agg[key] = { sedeId, sedeNome, modalidade, valor: 0 };
      }
      agg[key].valor += Number(e.valorJackpot || 0);
    }

    // Subtração dos prêmios pagos
    for (const s of saidas) {
      const sedeId = s.sedeId;
      const sedeNome = s.sede?.nome ?? "";
      const modalidade = s.modalidade === "Omaha" ? "Omaha" : "Texas";
      const key = `${sedeId}::${modalidade}`;

      if (!agg[key]) {
        agg[key] = { sedeId, sedeNome, modalidade, valor: 0 };
      }
      agg[key].valor -= Number(s.premio || 0);
    }

    // Monta a resposta (nunca negativo; 2 casas decimais)
    const resultado = Object.values(agg).map((item) => ({
      sede: item.sedeNome,
      modalidade: item.modalidade,
      jackpot: Math.max(Number(item.valor.toFixed(2)), 0),
    }));

    res.json(resultado);
    return;
  } catch (err) {
    console.error("GET /jackpot/atual erro:", err);
    res.status(500).json({ error: "Erro ao calcular o jackpot atual" });
    return;
  }
});

export default router;
