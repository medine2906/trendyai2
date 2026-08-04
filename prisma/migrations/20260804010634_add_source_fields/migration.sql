-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "fabric" TEXT,
    "season" TEXT,
    "tags" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 50,
    "aiSummary" TEXT,
    "sourceSite" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'scrape',
    "specifications" JSONB,
    "rawDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("aiSummary", "category", "createdAt", "description", "fabric", "id", "imageUrl", "name", "price", "season", "sourceSite", "sourceUrl", "stock", "tags") SELECT "aiSummary", "category", "createdAt", "description", "fabric", "id", "imageUrl", "name", "price", "season", "sourceSite", "sourceUrl", "stock", "tags" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
