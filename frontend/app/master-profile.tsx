"use client";

import { useEffect, useState } from "react";

export type ProfilePhoto = {
  src: string;
  description?: string;
};

export type ProfileWork = {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  image?: string;
  images: ProfilePhoto[];
};

export type ProfileProduct = {
  id: number;
  title: string;
  description?: string;
  price?: string;
  image?: string;
  sphere?: string;
  productionTime?: string;
};

type OpenWork = ProfileWork | null;

const display = "font-[family-name:var(--font-display)]";

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

function WorkDialog({ work, onClose }: { work: ProfileWork; onClose: () => void }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/50">
      <button type="button" aria-label="Закрыть" className="absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-dialog-title"
        className="relative z-10 flex h-[80vh] w-[80vw] flex-col overflow-y-auto bg-[#F6F3EE] p-6 md:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <h3 id="work-dialog-title" className={`${display} text-4xl font-light leading-none md:text-5xl`}>
            {work.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] text-[#F6F3EE]"
          >
            Закрыть
          </button>
        </div>
        {work.images.length === 0 ? (
          <p className="mt-10 text-sm font-light leading-7">В этой работе пока нет фотографий.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4">
            {work.images.map((photo) => (
              <figure key={photo.src}>
                <img
                  src={photo.src}
                  alt={photo.description || work.title}
                  className="aspect-[4/3] w-full bg-[#E7E1D8] object-cover object-center"
                />
                {photo.description ? (
                  <figcaption className="mt-3 text-sm font-light leading-7 text-[#1A1A1A]/70">
                    {photo.description}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MasterProfileBody({
  portfolios,
  products,
}: {
  portfolios: ProfileWork[];
  products: ProfileProduct[];
}) {
  const [open, setOpen] = useState<OpenWork>(null);

  return (
    <>
      <section className="mt-20">
        <h2 className={`${display} text-5xl font-light leading-none md:text-6xl`}>Портфолио</h2>
        {portfolios.length === 0 ? (
          <p className="mt-8 text-sm font-light leading-7">Работ пока нет.</p>
        ) : (
          <div className="mt-8">
            {portfolios.map((work) => (
              <article key={work.id} className="grid grid-cols-1 gap-6 border-t border-[#E7E1D8] py-10 md:grid-cols-12">
                <div className="md:col-span-5">
                  {work.image ? (
                    <img
                      src={work.image}
                      alt={work.title}
                      className="aspect-[5/4] w-full bg-[#E7E1D8] object-cover object-center"
                    />
                  ) : (
                    <div className="aspect-[5/4] bg-[#E7E1D8]" />
                  )}
                </div>
                <div className="md:col-span-7">
                  <h3 className={`${display} text-4xl font-light leading-none md:text-5xl`}>{work.title}</h3>
                  {work.description ? (
                    <p className="mt-4 max-w-xl text-sm font-light leading-7">{work.description}</p>
                  ) : null}
                  {work.duration ? (
                    <p className="mt-4 text-[11px] font-light uppercase tracking-[0.2em] text-[#1A1A1A]/45">
                      {work.duration}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(work)}
                    className="mt-6 bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] text-[#F6F3EE] transition-opacity hover:opacity-80"
                  >
                    Открыть
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-20">
        <h2 className={`${display} text-5xl font-light leading-none md:text-6xl`}>Товары</h2>
        {products.length === 0 ? (
          <p className="mt-8 text-sm font-light leading-7">Товаров пока нет.</p>
        ) : (
          <div className="mt-8">
            {products.map((product) => (
              <article
                key={product.id}
                className="grid grid-cols-1 gap-6 border-t border-[#E7E1D8] py-10 md:grid-cols-12"
              >
                <div className="md:col-span-5">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="aspect-[5/4] w-full bg-[#E7E1D8] object-cover object-center"
                    />
                  ) : (
                    <div className="aspect-[5/4] bg-[#E7E1D8]" />
                  )}
                </div>
                <div className="md:col-span-7">
                  <h3 className={`${display} text-4xl font-light leading-none md:text-5xl`}>{product.title}</h3>
                  {product.sphere ? (
                    <p className="mt-4 text-sm font-light leading-7 text-[#1A1A1A]/70">{product.sphere}</p>
                  ) : null}
                  {product.description ? (
                    <p className="mt-1 max-w-xl text-sm font-light leading-7">{product.description}</p>
                  ) : null}
                  <p className="mt-4 text-[11px] font-light uppercase tracking-[0.2em] text-[#1A1A1A]/45">
                    {priceFor(product.price)}
                    {product.productionTime ? ` · ${product.productionTime}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {open ? <WorkDialog work={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
