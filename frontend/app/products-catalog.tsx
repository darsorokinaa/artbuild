"use client";

import { useMemo, useState } from "react";
import { ProductTile, type ProductCardData } from "./product-card";

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
  productionTime?: string;
  rating?: number | null;
  reviews?: { id: number; author: string; rating: number; text: string }[];
};

function productsCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} изделие`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} изделия`;
  }

  return `${count} изделий`;
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
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {["Все", ...spheres].map((item) => {
            const active = item === sphere;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setSphere(item ?? "")}
                className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] ${
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
        <ul className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
          {visible.map((product) => {
            const card: ProductCardData = {
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
              image: product.image,
              sphere: product.sphere,
              seller: product.seller,
              sellerId: product.sellerId,
              avatar: product.avatar,
              productionTime: product.productionTime,
              rating: product.rating,
              reviews: product.reviews,
            };
            return (
              <li key={product.id}>
                <ProductTile product={card} uniform />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
