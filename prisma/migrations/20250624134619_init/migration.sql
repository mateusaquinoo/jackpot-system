-- CreateTable
CREATE TABLE "Sede" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "retiradasPadrao" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrada" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "modalidade" TEXT NOT NULL,
    "valorArrecadado" DOUBLE PRECISION NOT NULL,
    "retiradaEventos" DOUBLE PRECISION NOT NULL,
    "gerente" TEXT NOT NULL,
    "valorJackpot" DOUBLE PRECISION NOT NULL,
    "sedeId" INTEGER NOT NULL,

    CONSTRAINT "Entrada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Saida" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora" TEXT,
    "modalidade" TEXT NOT NULL,
    "mesa" TEXT,
    "jogador" TEXT NOT NULL,
    "mao" TEXT,
    "porcentagemRoleta" DOUBLE PRECISION,
    "premio" DOUBLE PRECISION NOT NULL,
    "feito" BOOLEAN NOT NULL DEFAULT false,
    "sedeId" INTEGER NOT NULL,

    CONSTRAINT "Saida_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saida" ADD CONSTRAINT "Saida_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
