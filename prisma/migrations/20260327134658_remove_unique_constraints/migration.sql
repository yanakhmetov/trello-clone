-- DropIndex
DROP INDEX "Column_boardId_order_key";

-- CreateIndex
CREATE INDEX "Column_boardId_order_idx" ON "Column"("boardId", "order");
