-- CreateTable
CREATE TABLE "BaixaEvento" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sedeId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "BaixaEvento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BaixaEvento" ADD CONSTRAINT "BaixaEvento_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
