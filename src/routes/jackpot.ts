// src/routes/jackpot.ts
import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

type Entrada = PrismaClient['entrada']
type Saida = PrismaClient['saida']

router.get('/atual', async (_req: Request, res: Response) => {
  try {
    const sedes = await prisma.sede.findMany({
      include: {
        entradas: true,
        saidas: true,
      },
    })

    const resultado: {
      sede: string
      modalidade: string
      jackpot: number
    }[] = []

    for (const sede of sedes) {
      const modalidades = ['Texas', 'Omaha']

      for (const modalidade of modalidades) {
        const entradas: Entrada[] = sede.entradas.filter((e: Entrada) => e.modalidade === modalidade)
        const saidas: Saida[] = sede.saidas.filter((s: Saida) => s.modalidade === modalidade)

        const totalEntrada = entradas.reduce((sum: number, e: Entrada) => sum + e.valorJackpot, 0)
        const totalSaida = saidas.reduce((sum: number, s: Saida) => sum + s.premio, 0)

        const jackpotAtual = totalEntrada - totalSaida

        resultado.push({
          sede: sede.nome,
          modalidade,
          jackpot: parseFloat(jackpotAtual.toFixed(2)),
        })
      }
    }

    res.json(resultado)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao calcular o jackpot atual' })
  }
})

export default router