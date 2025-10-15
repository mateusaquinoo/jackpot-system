-- CreateTable
CREATE TABLE "PremiacaoTabela" (
    "id" SERIAL NOT NULL,
    "modalidade" TEXT NOT NULL,
    "blind" TEXT NOT NULL,
    "mao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PremiacaoTabela_pkey" PRIMARY KEY ("id")
);
