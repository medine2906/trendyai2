-- Allow anonymous ("misafir") carts: CartItem.userId becomes optional and a
-- guestId (from a signed cookie, not a real account) can own a row instead.

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_userId_fkey";

-- DropIndex
DROP INDEX "CartItem_userId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "CartItem" ADD COLUMN "guestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_productId_key" ON "CartItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_guestId_productId_key" ON "CartItem"("guestId", "productId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
