"use client";

import { useState } from "react";
import { getImageUrl } from "./media-url";
import { ProductDialog, type ProductCardData } from "./product-card";

export type CatalogFilters = {
  category: string[];
  color: string[];
  texture: string[];
  material: string[];
  style: string[];
  format: string[];
  subject: string[];
};

export const emptyFilters: CatalogFilters = {
  category: [],
  color: [],
  texture: [],
  material: [],
  style: [],
  format: [],
  subject: [],
};

export type CatalogProduct = {
  id: number;
  title: string;
  description?: string;
  price?: string;
  sellerId?: number;
  seller?: string;
  avatar?: string;
  image?: string;
  images?: string[];
  sphere?: string;
  category?: string;
  color?: string;
  texture?: string;
  material?: string[];
  style?: string;
  format?: string;
  subject?: string;
  quantity?: number;
  dimensions?: string;
  weight?: string;
  madeToOrder?: boolean;
  productionTime?: string;
  rating?: number | null;
  reviews?: { id: number; author: string; rating: number; text: string }[];
};

const categories = ["Скульптура", "Живопись", "Декор", "Мебель", "Текстиль"] as const;

const facets = [
  { id: "color", label: "Цвет" },
  { id: "texture", label: "Текстура" },
  { id: "material", label: "Материал" },
  { id: "style", label: "Стиль" },
  { id: "format", label: "Формат" },
  { id: "subject", label: "Сюжет" },
] as const;

type FacetId = (typeof facets)[number]["id"];

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

const boxButton = `inline-flex min-h-11 items-center justify-center border px-4 text-[12px] uppercase tracking-[0.14em] ${focusRing}`;

function priceNumber(price?: string) {
  if (String(price ?? "").trim() === "") {
    return null;
  }
  const value = Number(String(price).replace(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function cardPrice(price?: string) {
  const value = priceNumber(price);
  if (value == null) {
    return "По запросу";
  }
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${digits} р`;
}

function facetValues(product: CatalogProduct, id: FacetId) {
  if (id === "material") {
    return product.material ?? [];
  }
  const value = product[id];
  return value ? [value] : [];
}

export function ProductsCatalogList({
  products,
  filters,
}: {
  products: CatalogProduct[];
  filters: CatalogFilters;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [picked, setPicked] = useState<Partial<Record<FacetId, string>>>({});
  const [openFacet, setOpenFacet] = useState<FacetId | null>(null);
  const visible = products.filter((product) => {
    if (category && product.category !== category) {
      return false;
    }
    return facets.every((facet) => {
      const value = picked[facet.id];
      if (!value) {
        return true;
      }
      return facetValues(product, facet.id).includes(value);
    });
  });

  function choose(id: FacetId, value: string) {
    setPicked((current) => {
      const next = { ...current };
      if (next[id] === value) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next;
    });
    setOpenFacet(null);
  }

  return (
    <div>
      <div className="relative border border-[#E6E6E6] bg-white px-6 py-12 text-center md:px-10 md:py-16">
        <h1 className="font-[family-name:var(--font-wordmark)] text-6xl font-medium lowercase leading-none tracking-tight sm:text-7xl md:text-8xl">
          naidista
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#767676]">naidista — заказывай и продавай искусство</p>
        <a
          href="/register?kind=customer"
          className={`${boxButton} mt-6 border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F4] md:absolute md:right-8 md:top-8 md:mt-0`}
        >
          Заказать работу
        </a>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
        <aside className="flex flex-col gap-3">
          <button
            type="button"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className={`${boxButton} ${
              category === null
                ? "border-[#1A1A1A] bg-white text-[#1A1A1A]"
                : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            Ресейл
          </button>
          <div className="mt-4 flex flex-col gap-3">
            {categories.map((item) => {
              const active = item === category;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? null : item)}
                  className={`${boxButton} ${
                    active
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-3">
            {facets.map((facet) => {
              const active = openFacet === facet.id || Boolean(picked[facet.id]);
              return (
                <button
                  key={facet.id}
                  type="button"
                  aria-expanded={openFacet === facet.id}
                  onClick={() => setOpenFacet((current) => (current === facet.id ? null : facet.id))}
                  className={`${boxButton} ${
                    active
                      ? "border-[#1A1A1A] bg-white text-[#1A1A1A]"
                      : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                  }`}
                >
                  {picked[facet.id] ? `${facet.label}: ${picked[facet.id]}` : facet.label}
                </button>
              );
            })}
          </div>
          {openFacet ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(filters[openFacet] ?? []).length === 0 ? (
                <p className="text-sm text-[#767676]">Нет значений.</p>
              ) : (
                filters[openFacet].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => choose(openFacet, value)}
                    className={`${boxButton} ${
                      picked[openFacet] === value
                        ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                        : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                    }`}
                  >
                    {value}
                  </button>
                ))
              )}
            </div>
          ) : null}

          <div className="mt-4 border border-[#E6E6E6] bg-white p-4 md:p-6">
            {visible.length === 0 ? (
              <p className="py-10 text-sm leading-7 text-[#767676]">Изделий пока нет.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8">
                {visible.map((product) => (
                  <li key={product.id}>
                    <CatalogCard product={product} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogCard({ product }: { product: CatalogProduct }) {
  const [open, setOpen] = useState(false);
  const photo = product.image || product.images?.[0];
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
    category: product.category,
    color: product.color,
    texture: product.texture,
    material: product.material,
    style: product.style,
    format: product.format,
    subject: product.subject,
    dimensions: product.dimensions,
    weight: product.weight,
    madeToOrder: product.madeToOrder,
    productionTime: product.productionTime,
    rating: product.rating,
    reviews: product.reviews,
  };

  return (
    <article>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full text-left ${focusRing}`}
      >
        {photo ? (
          <img src={getImageUrl(photo)} alt="" className="aspect-[4/5] w-full bg-white object-contain" />
        ) : (
          <span className="block aspect-[4/5] w-full bg-[#F4F4F4]" />
        )}
        <p className="mt-3 text-[12px] leading-5 text-[#767676]">
          {product.seller ? <span>{product.seller} </span> : null}
          {product.title ? <span>«{product.title}» </span> : null}
          <span>{cardPrice(product.price)}</span>
        </p>
      </button>
      {open ? <ProductDialog product={card} onClose={() => setOpen(false)} /> : null}
    </article>
  );
}
