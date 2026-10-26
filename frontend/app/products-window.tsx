import { connection } from "next/server";
import { ProductsCatalogList, type CatalogProduct } from "./products-catalog";

export async function ProductsCatalog() {
  await connection();
  let response: Response;

  try {
    response = await fetch("http://127.0.0.1:8000/api/catalog/", { cache: "no-store" });
  } catch {
    return <p className="px-6 py-16 text-sm font-light md:px-12 lg:px-16">Каталог временно недоступен.</p>;
  }

  if (!response.ok) {
    return <p className="px-6 py-16 text-sm font-light md:px-12 lg:px-16">Каталог временно недоступен.</p>;
  }

  const rows = await response.json();
  const products: CatalogProduct[] = rows.map(
    (product: {
      id: number;
      title?: string;
      description?: string;
      price?: string;
      seller_id?: number | null;
      seller_name?: string;
      avatar?: string | null;
      image?: string | null;
      sphere?: string | null;
      production_time?: string | null;
      rating?: number | null;
      reviews?: { id: number; author: string; rating: number; text: string }[];
    }) => ({
      id: product.id,
      title: product.title ?? "",
      description: product.description || "",
      price: product.price,
      sellerId: product.seller_id || undefined,
      seller: product.seller_name || "",
      avatar: product.avatar || undefined,
      image: product.image || undefined,
      sphere: product.sphere || "",
      productionTime: product.production_time || "",
      rating: product.rating ?? null,
      reviews: product.reviews ?? [],
    })
  );

  return (
    <section className="px-6 py-12 md:px-12 md:py-16 lg:px-16">
      <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/55">Каталог</p>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-7xl font-light leading-none tracking-tight md:text-8xl">
        Товары
      </h1>
      {products.length === 0 ? (
        <p className="mt-16 text-sm font-light leading-7">Товаров пока нет.</p>
      ) : (
        <ProductsCatalogList products={products} />
      )}
    </section>
  );
}
