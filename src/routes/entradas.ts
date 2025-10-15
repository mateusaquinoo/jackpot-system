// src/routes/entradas.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = Router();
const prisma = new PrismaClient();

/** Utilitário: calcula retirada e jackpot com base na regra da sede */
function calcularRetiradaEJackpot(valorArrecadado: number, retiradaPadrao: number) {
  const bruto = Math.max(Number(valorArrecadado) || 0, 0);
  const padrao = Math.max(Number(retiradaPadrao) || 0, 0);

  const retiradaEventos = bruto < padrao ? bruto : padrao;
  const valorJackpot = Math.max(bruto - retiradaEventos, 0);

  return { retiradaEventos, valorJackpot };
}

/** POST /entradas
 *  Cria uma nova entrada. Se "data" não for enviada, usa now().
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, sedeId, modalidade, valorArrecadado, gerente } = req.body as {
      data?: string;
      sedeId: number;
      modalidade: string;
      valorArrecadado: number;
      gerente: string;
    };

    if (!sedeId || !modalidade || typeof valorArrecadado !== 'number' || !gerente) {
      res.status(400).json({ error: 'Parâmetros inválidos: envie sedeId, modalidade, valorArrecadado (number) e gerente.' });
      return;
    }

    const sede = await prisma.sede.findUnique({ where: { id: Number(sedeId) } });
    if (!sede) {
      res.status(404).json({ error: 'Sede não encontrada.' });
      return;
    }

    const quando = data ? new Date(data) : new Date();
    if (isNaN(quando.getTime())) {
      res.status(400).json({ error: 'Data inválida. Envie em ISO (ex.: 2025-09-04T18:32:00.000Z) ou omita para usar now().' });
      return;
    }

    const { retiradaEventos, valorJackpot } = calcularRetiradaEJackpot(valorArrecadado, sede.retiradasPadrao);

    const entrada = await prisma.entrada.create({
      data: {
        data: quando,
        sedeId: Number(sedeId),
        modalidade: modalidade === 'Omaha' ? 'Omaha' : 'Texas',
        valorArrecadado,
        retiradaEventos,
        gerente,
        valorJackpot,
      },
      include: { sede: true },
    });

    res.status(201).json(entrada);
    return;
  } catch (error) {
    console.error('POST /entradas erro:', error);
    res.status(500).json({ error: 'Erro ao registrar entrada' });
    return;
  }
});

/** GET /entradas
 *  Lista todas as entradas (mais recentes primeiro)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const entradas = await prisma.entrada.findMany({
      orderBy: { data: 'desc' },
      include: { sede: true },
    });

    res.status(200).json(entradas);
    return;
  } catch (error) {
    console.error('GET /entradas erro:', error);
    res.status(500).json({ error: 'Erro ao buscar entradas' });
    return;
  }
});

/** PUT /entradas/:id
 *  Atualiza modalidade e/ou valorArrecadado.
 *  Recalcula retiradaEventos e valorJackpot com base na sede.
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const { modalidade, valorArrecadado } = req.body as {
      modalidade?: string;
      valorArrecadado?: number;
    };

    if (modalidade === undefined && valorArrecadado === undefined) {
      res.status(400).json({ error: 'Nada para atualizar. Envie "modalidade" e/ou "valorArrecadado".' });
      return;
    }

    const entrada = await prisma.entrada.findUnique({
      where: { id },
      include: { sede: true },
    });

    if (!entrada) {
      res.status(404).json({ error: 'Entrada não encontrada.' });
      return;
    }

    const dataUpdate: Record<string, any> = {};

    if (typeof modalidade === 'string') {
      dataUpdate.modalidade = modalidade === 'Omaha' ? 'Omaha' : 'Texas';
    }

    if (typeof valorArrecadado === 'number' && !Number.isNaN(valorArrecadado)) {
      const { retiradaEventos, valorJackpot } = calcularRetiradaEJackpot(
        valorArrecadado,
        entrada.sede.retiradasPadrao
      );
      dataUpdate.valorArrecadado = valorArrecadado;
      dataUpdate.retiradaEventos = retiradaEventos;
      dataUpdate.valorJackpot = valorJackpot;
    }

    const updated = await prisma.entrada.update({
      where: { id },
      data: dataUpdate,
      include: { sede: true },
    });

    res.json(updated);
    return;
  } catch (error) {
    console.error('PUT /entradas/:id erro:', error);
    res.status(500).json({ error: 'Falha ao atualizar a entrada' });
    return;
  }
});

export default router;
