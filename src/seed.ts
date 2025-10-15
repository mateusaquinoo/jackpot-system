// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.sede.createMany({
    data: [
      { nome: 'Alphaville', retiradasPadrao: 500 },
      { nome: 'Jd. América', retiradasPadrao: 750 }
    ]
  })

  console.log('Sedes criadas com sucesso ✅')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })