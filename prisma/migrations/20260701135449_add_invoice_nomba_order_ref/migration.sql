-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "nombaOrderRef" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_nombaOrderRef_idx" ON "Invoice"("nombaOrderRef");
