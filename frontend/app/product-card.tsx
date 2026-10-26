"use client";

import { useEffect, useState } from "react";
import { getImageUrl } from "./media-url";
import { ContactAuthor } from "./messenger";

export type ProductReviewData = {
  id: number;
  author: string;
  rating: number;
  text: string;
};

export type ProductCardData = {
  id: number;
  title: string;
  description?: string;
  price?: string;
  image?: string;
  sphere?: string;
  seller?: string;
  sellerId?: number;
  avatar?: string;
  productionTime?: string;
  rating?: number | null;
  reviews?: ProductReviewData[];
};

function ratingLabel(rating?: number | null) {
  if (rating == null || !Number.isFinite(rating)) {
    return "";
  }
  return (Math.round(rating * 10) / 10).toFixed(1).replace(".", ",");
}

function stars(rating: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

function priceFor(price?: string) {
  const value = Number(String(price ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(value) || String(price ?? "").trim() === "") {
    return "По запросу";
  }
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${digits} ₽`;
}

export function ProductDialog({
  product,
  onClose,
}: {
  product: ProductCardData;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const authorName = product.seller ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/50">
      <button type="button" aria-label="Закрыть" className="absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
        className="relative z-10 flex h-[80vh] w-[80vw] flex-col overflow-y-auto bg-white p-6 md:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <h3 id="product-dialog-title" className="font-[family-name:var(--font-display)] text-4xl font-light leading-none md:text-5xl">
            {product.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[#1A1A1A]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.5]">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt={product.title}
            className="mt-8 aspect-[5/4] w-full bg-[#E7E1D8] object-cover object-center md:aspect-[16/9]"
          />
        ) : (
          <div className="mt-8 aspect-[5/4] bg-[#E7E1D8] md:aspect-[16/9]" />
        )}
        <div className="mt-8 flex items-center gap-3">
          {product.avatar ? (
            <img src={getImageUrl(product.avatar)} alt="" className="h-8 w-8 bg-[#E7E1D8] object-cover object-top" />
          ) : null}
          {product.sellerId ? (
            <a href={`/masters/${product.sellerId}`} className="text-sm font-light leading-7 hover:underline">
              {authorName}
            </a>
          ) : (
            <p className="text-sm font-light leading-7">{authorName}</p>
          )}
        </div>
        {product.sphere ? <p className="mt-1 text-sm font-light leading-7 text-[#1A1A1A]/70">{product.sphere}</p> : null}
        {product.description ? <p className="mt-4 max-w-2xl text-sm font-light leading-7">{product.description}</p> : null}
        <p className="mt-4 text-[11px] font-light uppercase tracking-[0.2em] text-[#1A1A1A]/45">
          {priceFor(product.price)}
          {product.productionTime ? ` · ${product.productionTime}` : ""}
        </p>
        {product.sellerId ? (
          <ContactAuthor productId={product.id} productTitle={product.title} authorName={authorName} />
        ) : null}
        <section className="mt-10 border-t border-[#E7E1D8] pt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h4 className="font-[family-name:var(--font-display)] text-3xl font-light leading-none">Отзывы</h4>
            <p className="text-[11px] font-light uppercase tracking-[0.2em] text-[#1A1A1A]/45">
              {ratingLabel(product.rating) ? `Рейтинг ${ratingLabel(product.rating)}` : "Рейтинга пока нет"}
            </p>
          </div>
          {(product.reviews ?? []).length === 0 ? (
            <p className="mt-6 text-sm font-light leading-7">Отзывов пока нет.</p>
          ) : (
            <div className="mt-6">
              {(product.reviews ?? []).map((review) => (
                <article key={review.id} className="border-t border-[#E7E1D8] py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm font-light">{review.author}</p>
                    <p className="shrink-0 text-[11px] font-light tracking-[0.16em] text-[#1A1A1A]/55">
                      {stars(review.rating)}
                    </p>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm font-light leading-7">{review.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function ProductName({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`text-left ${className ?? ""}`}>
        {product.title}
      </button>
      {open ? <ProductDialog product={product} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function cardPrice(price?: string) {
  const formatted = priceFor(price);
  return formatted === "По запросу" ? formatted : formatted.replace("₽", "р");
}

export function ProductTile({ product, uniform = false }: { product: ProductCardData; uniform?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="relative block w-full text-left">
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt=""
            className={`${uniform ? "aspect-square object-cover object-center" : "block h-auto rounded-2xl"} w-full bg-[#E6E4DF]`}
          />
        ) : (
          <span className={`${uniform ? "aspect-square" : "h-56 rounded-2xl"} block w-full bg-[#E6E4DF]`} />
        )}
        {uniform ? (
          <span className="mt-3 block text-[15px] leading-5 text-[#1A1A1A]">
            <span className="flex items-baseline justify-between gap-3 sm:hidden">
              <span>{product.seller}</span>
              <span className="shrink-0">{cardPrice(product.price)}</span>
            </span>
            <span className="mt-1 block text-center font-medium italic sm:hidden">"{product.title}"</span>
            <span className="hidden grid-cols-[1fr_auto_1fr] items-baseline gap-3 sm:grid">
              <span className="truncate">{product.seller}</span>
              <span className="max-w-[14rem] truncate text-center font-medium italic">"{product.title}"</span>
              <span className="text-right">{cardPrice(product.price)}</span>
            </span>
          </span>
        ) : (
          <span className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-4 pt-16 text-white">
            {product.seller ? <span className="block text-[13px] text-white/75">{product.seller}</span> : null}
            <span className="mt-1 block font-[family-name:var(--font-display)] text-[1.65rem] leading-tight">
              {product.title}
              <span className="text-white/80"> · {priceFor(product.price)}</span>
            </span>
          </span>
        )}
      </button>
      {open ? <ProductDialog product={product} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function ViewProduct({ product }: { product: ProductCardData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-[13px] text-[#1A1A1A]"
      >
        Смотреть
      </button>
      {open ? <ProductDialog product={product} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
