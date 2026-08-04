import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CartItemRow } from "@/components/commerce/cart-item-row";
import { formatTL } from "@/lib/utils";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const items = await db.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-semibold">Sepetim</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ürünler burada sadece saklanır. Bir ürüne tıkladığında satıldığı siteye (Trendyol/Amazon) yönlendirilirsin.
      </p>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Sepetiniz boş.</p>
      ) : (
        <>
          <div className="flex flex-col">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={{
                  id: item.id,
                  quantity: item.quantity,
                  product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    imageUrl: item.product.imageUrl,
                    sourceSite: item.product.sourceSite,
                    sourceUrl: item.product.sourceUrl,
                  },
                }}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-lg font-semibold">Toplam</span>
            <span className="text-lg font-semibold">{formatTL(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
