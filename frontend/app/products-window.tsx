import { connection } from "next/server";
import { emptyFilters, ProductsCatalogList, type CatalogFilters, type CatalogProduct } from "./products-catalog";

export async function ProductsCatalog() {
  await connection();
  let response: Response;

  try {
    response = await fetch("http://127.0.0.1:8000/api/catalog/", { cache: "no-store" });
  } catch {
    return <CatalogMessage>Каталог временно недоступен.</CatalogMessage>;
  }

  if (!response.ok) {
    return <CatalogMessage>Каталог временно недоступен.</CatalogMessage>;
  }

  const rows = await response.json();
  let filters: CatalogFilters = emptyFilters;
  try {
    const filtersResponse = await fetch("http://127.0.0.1:8000/api/filters/", { cache: "no-store" });
    if (filtersResponse.ok) {
      const payload = await filtersResponse.json();
      filters = {
        category: payload.category ?? [],
        color: payload.color ?? [],
        texture: payload.texture ?? [],
        material: payload.material ?? [],
        style: payload.style ?? [],
        format: payload.format ?? [],
        subject: payload.subject ?? [],
      };
    }
  } catch {
    filters = emptyFilters;
  }
  const products: CatalogProduct[] = rows.map(
    (product: {
      id: number;
      title?: string;
      description?: string;
      price?: string;
      quantity?: number;
      seller_id?: number | null;
      seller_name?: string;
      avatar?: string | null;
      image?: string | null;
      images?: string[] | null;
      sphere?: string | null;
      filters?: {
        category?: string;
        color?: string;
        texture?: string;
        material?: string[];
        style?: string;
        format?: string;
        subject?: string;
      };
      dimensions?: string | null;
      weight?: string | null;
      made_to_order?: boolean;
      production_time?: string | null;
      rating?: number | null;
      reviews?: { id: number; author: string; rating: number; text: string }[];
    }) => ({
      id: product.id,
      title: product.title ?? "",
      description: product.description || "",
      price: product.price,
      quantity: typeof product.quantity === "number" ? product.quantity : undefined,
      sellerId: product.seller_id || undefined,
      seller: product.seller_name || "",
      avatar: product.avatar || undefined,
      image: product.image || undefined,
      images: product.images ?? [],
      sphere: product.sphere || "",
      category: product.filters?.category || "",
      color: product.filters?.color || "",
      texture: product.filters?.texture || "",
      material: product.filters?.material ?? [],
      style: product.filters?.style || "",
      format: product.filters?.format || "",
      subject: product.filters?.subject || "",
      dimensions: product.dimensions || "",
      weight: product.weight || "",
      madeToOrder: typeof product.made_to_order === "boolean" ? product.made_to_order : undefined,
      productionTime: product.production_time || "",
      rating: product.rating ?? null,
      reviews: product.reviews ?? [],
    })
  );

  return (
    <section className="mx-auto w-full max-w-[1680px] px-4 py-12 text-[#242321] sm:px-8 lg:px-10 lg:py-16">
      <p className="text-[11px] tracking-[0.28em] text-[#77736E]">
        <span className="lowercase">blurrr</span>
        <span className="uppercase"> / Каталог</span>
      </p>
      <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
        Изделия
      </h1>
      <p className="mt-5 max-w-xl text-base font-light leading-7 text-[#77736E]">
        Авторские работы, искусство и предметы интерьера от независимых мастеров.
      </p>
      {products.length === 0 ? (
        <p className="mt-16 text-sm font-light leading-7 text-[#77736E]">Изделий пока нет.</p>
      ) : (
        <ProductsCatalogList products={products} filters={filters} />
      )}
    </section>
  );
}

function CatalogMessage({ children }: { children: string }) {
  return (
    <section className="mx-auto w-full max-w-[1680px] px-4 py-16 text-[#242321] sm:px-8 lg:px-10">
      <p className="text-sm font-light leading-7 text-[#77736E]">{children}</p>
    </section>
  );
}
