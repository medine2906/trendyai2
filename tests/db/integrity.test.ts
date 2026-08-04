import { describe, it, expect, afterAll } from "vitest";
import { db } from "../../src/lib/db";

describe("Veritabanı bağlantısı ve şema", () => {
  it("test veritabanına bağlanabiliyor", async () => {
    const result = await db.$queryRawUnsafe<{ result: number | bigint }[]>("SELECT 1 as result");
    expect(Number(result[0].result)).toBe(1);
  });

  it("seed edilmiş test ürünleri okunabiliyor", async () => {
    const products = await db.product.findMany({
      where: { id: { in: ["test-prod-tshirt", "test-prod-coat"] } },
    });
    expect(products).toHaveLength(2);
  });

  it("her ürünün geçerli bir fiyatı, kaynak sitesi ve kaynak url'i var", async () => {
    const products = await db.product.findMany();
    for (const p of products) {
      expect(p.price).toBeGreaterThan(0);
      expect(["Amazon", "Trendyol"]).toContain(p.sourceSite);
      expect(p.sourceUrl).toMatch(/^https?:\/\//);
    }
  });
});

describe("Referans bütünlüğü", () => {
  it("her CartItem gerçek bir User ve Product'a işaret ediyor (orphan yok)", async () => {
    const cartItems = await db.cartItem.findMany();
    for (const item of cartItems) {
      const [user, product] = await Promise.all([
        db.user.findUnique({ where: { id: item.userId } }),
        db.product.findUnique({ where: { id: item.productId } }),
      ]);
      expect(user, `CartItem ${item.id} sahipsiz kullanıcıya işaret ediyor`).not.toBeNull();
      expect(product, `CartItem ${item.id} var olmayan ürüne işaret ediyor`).not.toBeNull();
    }
  });

  it("her SearchHistory kaydı gerçek bir User'a işaret ediyor", async () => {
    const searches = await db.searchHistory.findMany({ take: 200 });
    for (const s of searches) {
      const user = await db.user.findUnique({ where: { id: s.userId } });
      expect(user, `SearchHistory ${s.id} sahipsiz kullanıcıya işaret ediyor`).not.toBeNull();
    }
  });

  it("her username ve email benzersiz", async () => {
    const users = await db.user.findMany({ select: { username: true, email: true } });
    expect(new Set(users.map((u) => u.username)).size).toBe(users.length);
    expect(new Set(users.map((u) => u.email)).size).toBe(users.length);
  });
});

afterAll(async () => {
  await db.$disconnect();
});
