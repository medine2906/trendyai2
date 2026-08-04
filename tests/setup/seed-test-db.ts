import { db } from "../../src/lib/db";

const TEST_PRODUCTS = [
  {
    id: "test-prod-tshirt",
    name: "Test Kadın Pamuklu Tişört",
    description: "Otomasyon testleri için sabit ürün — yazlık, rahat kesim pamuklu tişört.",
    category: "Kadın Giyim",
    price: 199.9,
    imageUrl: "https://m.media-amazon.com/images/test-placeholder.jpg",
    fabric: "Pamuk",
    season: "Yaz",
    tags: "tişört, yazlık, pamuklu, rahat kesim, kadın",
    sourceSite: "Amazon",
    sourceUrl: "https://www.amazon.com.tr/dp/TESTPRODUCT1",
  },
  {
    id: "test-prod-coat",
    name: "Test Erkek Kışlık Mont",
    description: "Otomasyon testleri için sabit ürün — kalın, su geçirmez kışlık mont.",
    category: "Erkek Giyim",
    price: 899.5,
    imageUrl: "https://m.media-amazon.com/images/test-placeholder-2.jpg",
    fabric: "Polyester",
    season: "Kış",
    tags: "mont, kışlık, su geçirmez, kalın, erkek",
    sourceSite: "Trendyol",
    sourceUrl: "https://www.trendyol.com/test-urun/p-TESTPRODUCT2",
  },
];

async function main() {
  for (const product of TEST_PRODUCTS) {
    await db.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${TEST_PRODUCTS.length} test products into ${process.env.DATABASE_URL}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
