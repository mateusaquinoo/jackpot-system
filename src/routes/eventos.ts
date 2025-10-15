import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ➤ GET /eventos/retiradas
router.get('/retiradas', async (_req: Request, res: Response) => {
  try {
    const entradas = await prisma.entrada.findMany({
      select: {
        data: true,
        retiradaEventos: true,
        sede: {
          select: {
            nome: true
          }
        }
      }
    });

    res.json(entradas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar retiradas automáticas' });
  }
});

// ➤ GET /eventos/baixas
router.get('/baixas', async (_req: Request, res: Response) => {
  try {
    const baixas = await prisma.baixaEvento.findMany({
      orderBy: { data: 'desc' },
      include: { sede: true }
    });

    res.json(baixas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar baixas' });
  }
});

// ➤ POST /eventos/baixas
router.post('/baixas', async (req: Request, res: Response) => {
  const { sedeId, valor, observacao } = req.body;

  try {
    const nova = await prisma.baixaEvento.create({
      data: {
        sedeId,
        valor,
        observacao
      }
    });

    res.status(201).json(nova);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar baixa' });
  }
});

export default router;