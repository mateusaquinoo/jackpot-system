// src/routes/saidas.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/** Utilitário: calcula o jackpot atual (entradas.valorJackpot - saidas.premio) por sede e modalidade.
 *  Se "saidaIdParaIgnorar" for passado, desconsidera essa saída do somatório (útil no PUT).
 */
async function calcularJackpotAtual(
  sedeId: number,
  modalidade: 'Texas' | 'Omaha' | string,
  saidaIdParaIgnorar?: number
): Promise<number> {
  const [entradas, saidas] = await Promise.all([
    prisma.entrada.findMany({ where: { sedeId, modalidade } }),
    prisma.saida.findMany({
      where: {
        sedeId,
        modalidade,
        ...(saidaIdParaIgnorar ? { NOT: { id: saidaIdParaIgnorar } } : {})
      }
    })
  ]);

  const totalEntradas = entradas.reduce((sum, e) => sum + (e.valorJackpot || 0), 0);
  const totalSaidas = saidas.reduce((sum, s) => sum + (s.premio || 0), 0);
  return Math.max(totalEntradas - totalSaidas, 0);
}

/** Utilitário: pega a regra de premiação para (modalidade, blind/mesa, mao) */
async function obterRegraPremiacao(modalidade: string, mesa: string, mao: string) {
  return prisma.premiacaoTabela.findFirst({
    where: { modalidade, blind: mesa, mao }
  });
}

/** POST /saidas
 *  Registra uma nova saída (prêmio), calculando o prêmio conforme a tabela e o jackpot atual.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const {
    data,
    hora,
    modalidade,
    mesa,
    jogador,
    mao,
    sedeId,
    feito,
    gerente
  } = req.body as {
    data?: string;
    hora?: string;
    modalidade: string;
    mesa: string;
    jogador?: string;
    mao: string;
    sedeId: number;
    feito?: boolean;
    gerente: string;
  };

  try {
    if (!sedeId || !modalidade || !mesa || !mao || !gerente) {
      res.status(400).json({ error: 'Parâmetros inválidos: envie sedeId, modalidade, mesa, mao e gerente.' });
      return;
    }

    const sede = await prisma.sede.findUnique({ where: { id: Number(sedeId) } });
    if (!sede) {
      res.status(404).json({ error: 'Sede não encontrada' });
      return;
    }

    const regra = await obterRegraPremiacao(modalidade, mesa, mao);
    if (!regra) {
      res.status(400).json({ error: 'Regra de premiação não encontrada' });
      return;
    }

    const quando = data ? new Date(data) : new Date();
    if (isNaN(quando.getTime())) {
      res.status(400).json({ error: 'Data inválida. Envie ISO (ex.: 2025-09-04T18:32:00.000Z) ou omita para usar now().' });
      return;
    }

    const jackpot = await calcularJackpotAtual(Number(sedeId), modalidade);

    let premio = 0;
    if (regra.tipo === 'fixo') {
      premio = regra.valor;
    } else if (regra.tipo === 'percentual') {
      premio = Number((jackpot * regra.valor).toFixed(2));
    }

    const saida = await prisma.saida.create({
      data: {
        data: quando,
        hora: hora || null,
        modalidade,
        mesa,
        jogador: jogador || 'PREMIADO',
        mao,
        porcentagemRoleta: regra.tipo === 'percentual' ? regra.valor : null,
        premio,
        feito: !!feito,
        gerente,
        sedeId: Number(sedeId)
      },
      include: { sede: true }
    });

    res.status(201).json(saida);
    return;
  } catch (error) {
    console.error('POST /saidas erro:', error);
    res.status(500).json({ error: 'Erro ao registrar saída' });
    return;
  }
});

/** GET /saidas
 *  Lista todas as saídas (mais recentes primeiro)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const saidas = await prisma.saida.findMany({
      orderBy: { data: 'desc' },
      include: { sede: true }
    });
    res.status(200).json(saidas);
    return;
  } catch (error) {
    console.error('GET /saidas erro:', error);
    res.status(500).json({ error: 'Erro ao listar saídas' });
    return;
  }
});

/** GET /saidas/ultimas
 *  Retorna as últimas 5 saídas
 */
router.get('/ultimas', async (_req: Request, res: Response): Promise<void> => {
  try {
    const ultimas = await prisma.saida.findMany({
      orderBy: { data: 'desc' },
      take: 5,
      include: { sede: true }
    });
    res.status(200).json(ultimas);
    return;
  } catch (error) {
    console.error('GET /saidas/ultimas erro:', error);
    res.status(500).json({ error: 'Erro ao buscar últimas saídas' });
    return;
  }
});

/** GET /saidas/por-sede/:id
 *  Lista saídas por sede (mais recentes primeiro)
 */
router.get('/por-sede/:id', async (req: Request, res: Response): Promise<void> => {
  const sedeId = Number(req.params.id);

  if (isNaN(sedeId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const saidas = await prisma.saida.findMany({
      where: { sedeId },
      orderBy: { data: 'desc' },
      include: { sede: true }
    });

    res.status(200).json(saidas);
    return;
  } catch (error) {
    console.error('GET /saidas/por-sede erro:', error);
    res.status(500).json({ error: 'Erro ao buscar saídas por sede' });
    return;
  }
});

/** PUT /saidas/:id
 *  Atualiza modalidade, mesa e/ou mao de uma saída.
 *  Recalcula o prêmio com base na nova combinação (modalidade, mesa, mao) e no jackpot atual.
 *  Observação: ao recalcular o jackpot, desconsideramos esta própria saída.
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const { modalidade, mesa, mao } = req.body as {
      modalidade?: string;
      mesa?: string;
      mao?: string;
    };

    if (modalidade === undefined && mesa === undefined && mao === undefined) {
      res.status(400).json({ error: 'Nada para atualizar. Envie "modalidade", "mesa" e/ou "mao".' });
      return;
    }

    const saidaAtual = await prisma.saida.findUnique({
      where: { id },
      include: { sede: true }
    });

    if (!saidaAtual) {
      res.status(404).json({ error: 'Saída não encontrada.' });
      return;
    }

    // modalidade sempre em 'Texas' | 'Omaha'
    const novaModalidade: 'Texas' | 'Omaha' =
      typeof modalidade === 'string'
        ? (modalidade === 'Omaha' ? 'Omaha' : 'Texas')
        : (saidaAtual.modalidade === 'Omaha' ? 'Omaha' : 'Texas');

    // garantir strings não nulas e não vazias para mesa e mao
    const novaMesa: string = (typeof mesa === 'string' ? mesa : (saidaAtual.mesa ?? '')).trim();
    if (!novaMesa) {
      res.status(400).json({ error: 'Mesa inválida ou ausente.' });
      return;
    }

    const novaMao: string = (typeof mao === 'string' ? mao : (saidaAtual.mao ?? '')).trim();
    if (!novaMao) {
      res.status(400).json({ error: 'Mão inválida ou ausente.' });
      return;
    }

    // busca regra para a nova combinação
    const regra = await obterRegraPremiacao(novaModalidade, novaMesa, novaMao);
    if (!regra) {
      res.status(400).json({ error: 'Regra de premiação não encontrada para a combinação informada.' });
      return;
    }

    // calcula jackpot atual desconsiderando a própria saída
    const jackpot = await calcularJackpotAtual(Number(saidaAtual.sedeId), novaModalidade, id);

    let novoPremio = 0;
    if (regra.tipo === 'fixo') {
      novoPremio = regra.valor;
    } else if (regra.tipo === 'percentual') {
      novoPremio = Number((jackpot * regra.valor).toFixed(2));
    }

    const atualizada = await prisma.saida.update({
      where: { id },
      data: {
        modalidade: novaModalidade,
        mesa: novaMesa,
        mao: novaMao,
        porcentagemRoleta: regra.tipo === 'percentual' ? regra.valor : null,
        premio: novoPremio
      },
      include: { sede: true }
    });

    res.json(atualizada);
    return;
  } catch (error) {
    console.error('PUT /saidas/:id erro:', error);
    res.status(500).json({ error: 'Falha ao atualizar a saída' });
    return;
  }
});

export default router;
