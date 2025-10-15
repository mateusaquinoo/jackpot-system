import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.premiacaoTabela.createMany({
    data: [
      // Texas – Quadra (fixo)
      { modalidade: 'Texas', blind: '1-2', mao: 'Quadra', tipo: 'fixo', valor: 50 },
      { modalidade: 'Texas', blind: '5-5', mao: 'Quadra', tipo: 'fixo', valor: 200 },
      { modalidade: 'Texas', blind: '5-10', mao: 'Quadra', tipo: 'fixo', valor: 500 },
      { modalidade: 'Texas', blind: '10-25+', mao: 'Quadra', tipo: 'fixo', valor: 1000 },

      // Texas – Straight Flush e Royal
      { modalidade: 'Texas', blind: '1-2', mao: 'Straight Flush', tipo: 'percentual', valor: 0.009 },
      { modalidade: 'Texas', blind: '1-2', mao: 'Royal Straight Flush', tipo: 'percentual', valor: 0.025 },
      { modalidade: 'Texas', blind: '5-5', mao: 'Straight Flush', tipo: 'percentual', valor: 0.0135 },
      { modalidade: 'Texas', blind: '5-5', mao: 'Royal Straight Flush', tipo: 'percentual', valor: 0.0375 },

      // Omaha – Straight Flush e Royal
      { modalidade: 'Omaha', blind: '1-2', mao: 'Straight Flush', tipo: 'percentual', valor: 0.012 },
      { modalidade: 'Omaha', blind: '1-2', mao: 'Royal Straight Flush', tipo: 'percentual', valor: 0.035 },
      { modalidade: 'Omaha', blind: '5-5', mao: 'Straight Flush', tipo: 'percentual', valor: 0.018 },
      { modalidade: 'Omaha', blind: '5-5', mao: 'Royal Straight Flush', tipo: 'percentual', valor: 0.042 }
      // [... continue com as demais regras se quiser]
    ]
  })

  console.log('Tabela de premiação criada ✅')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })