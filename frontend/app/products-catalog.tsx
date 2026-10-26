"use client";

import { useMemo, useState } from "react";

export type CatalogProduct = {
  id: number;
  title: string;
  description?: string;
  price?: string;
  sellerId?: number;
  seller?: string;
  avatar?: string;
  image?: string;
  sphere?: string;
};

function productsCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} товар`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} товара`;
  }

  return `${count} товаров`;
}

function priceFor(price?: string) {
  const value = Number(price);
  if (!Number.isFinite(value)) {
    return "По запросу";
  }
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${digits} ₽`;
}

export function ProductsCatalogList({ products }: { products: CatalogProduct[] }) {
  const [sphere, setSphere] = useState("Все");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("ru");
  const spheres = useMemo(
    () => [...new Set(products.map((product) => product.sphere).filter(Boolean))].sort((a, b) => (a ?? "").localeCompare(b ?? "", "ru")),
    [products]
  );
  const visible = useMemo(
    () =>
      products.filter((product) => {
        const sameSphere = sphere === "Все" || product.sphere === sphere;
        const haystack = `${product.title} ${product.seller ?? ""}`.toLocaleLowerCase("ru");
        return sameSphere && (needle.length === 0 || haystack.includes(needle));
      }),
    [products, sphere, needle]
  );

  return (
    <>
      <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex flex-wrap gap-2">
          {["Все", ...spheres].map((item) => {
            const active = item === sphere;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setSphere(item ?? "")}
                className={`px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] ${
                  active ? "bg-[#1A1A1A] text-[#F6F3EE]" : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название"
          aria-label="Поиск по названию"
          className="w-48 border-b border-[#E7E1D8] bg-transparent py-2 text-sm font-light outline-none placeholder:text-[#1A1A1A]/35"
        />
        <p className="ml-auto pb-2 text-[11px] font-light uppercase tracking-[0.22em] text-[#1A1A1A]/45">
          {productsCount(visible.length)}
        </p>
      </div>
      {visible.length === 0 ? (
        <p className="mt-16 text-sm font-light leading-7">Ничего не нашлось.</p>
      ) : (
        <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-20 md:grid-cols-2">
          {visible.map((product) => (
            <article key={product.id}>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="aspect-[5/4] w-full bg-[#E7E1D8] object-cover object-center"
                />
              ) : (
                <div className="aspect-[5/4] bg-[#E7E1D8]" />
              )}
              <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-light leading-none tracking-tight md:text-5xl">
                {product.title}
              </h2>
              <div className="mt-4 flex items-center gap-3">
                {product.avatar ? (
                  <img src={product.avatar} alt="" className="h-8 w-8 bg-[#E7E1D8] object-cover object-top" />
                ) : null}
                {product.sellerId ? (
                  <a href={`/masters/${product.sellerId}`} className="text-sm font-light leading-7 hover:underline">
                    {product.seller}
                  </a>
                ) : (
                  <p className="text-sm font-light leading-7">{product.seller}</p>
                )}
              </div>
              {product.sphere ? (
                <p className="mt-1 text-sm font-light leading-7 text-[#1A1A1A]/70">{product.sphere}</p>
              ) : null}
              {product.description ? (
                <p className="mt-1 max-w-md text-sm font-light leading-7">{product.description}</p>
              ) : null}
              <p className="mt-4 text-[11px] font-light uppercase tracking-[0.2em] text-[#1A1A1A]/45">
                {priceFor(product.price)}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
