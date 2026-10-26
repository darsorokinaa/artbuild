import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { getImageUrl } from "./media-url";
import { MastersWindow, StageFallback } from "./masters-window";
import { SiteShell } from "./site-shell";

export const metadata: Metadata = {
  title: "ArtBuild — Каталог мастеров",
  description:
    "Галерея профессионалов ArtBuild: работы мастеров, профили и подборки реализованных проектов.",
};

type Master = {
  id: number;
  name: string;
  specialization: string;
  city: string;
  work?: string;
  price?: string;
  image?: string;
  avatar?: string;
  decription?: string;
};

const workImages = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80",
];

const collections = [
  {
    title: "Жилые интерьеры",
    note: "Свет и пропорции",
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=80",
    frame: "lg:col-span-7",
    image: "aspect-[5/4] w-full object-cover sm:aspect-[16/10]",
  },
  {
    title: "Предметы и мебель",
    note: "Столярные работы",
    src: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1400&q=80",
    frame: "lg:col-span-5",
    image: "aspect-[5/4] w-full object-cover lg:aspect-[4/5]",
  },
  {
    title: "Камень и свет",
    note: "Реализованные проекты",
    src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1800&q=80",
    frame: "lg:col-span-12",
    image: "aspect-[4/5] w-full object-cover lg:aspect-[16/9] lg:object-[center_42%]",
  },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

function imageFor(master: Master, index: number) {
  if (master.image) {
    return master.image;
  }

  return workImages[index % workImages.length];
}

function priceFor(master: Master) {
  const price = master.price?.trim();
  return price ? price : "По запросу";
}

function indexLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

function countLabel(count: number) {
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

function WorkImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <img src={getImageUrl(src)} alt={alt} className={`bg-[#E6E4DF] ${className}`} />
  );
}

function MasterLabel({
  master,
  index,
}: {
  master: Master;
  index: number;
}) {
  return (
    <figcaption className="mt-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg font-light">{master.name}</p>
        <p className="shrink-0 text-[11px] uppercase tracking-[0.22em]">{indexLabel(index)}</p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {master.avatar ? (
          <img
            src={getImageUrl(master.avatar)}
            alt=""
            className="h-8 w-8 shrink-0 bg-[#E6E4DF] object-cover object-top"
          />
        ) : null}
        <p className="text-sm">{master.specialization}</p>
      </div>
      {master.work ? <p className="mt-1 text-sm">{master.work}</p> : null}
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[#E6E4DF] pt-3 text-sm">
        <p className="text-[#1A1A1A]/70">{master.city}</p>
        <p className="shrink-0 text-[11px] uppercase tracking-[0.16em]">{priceFor(master)}</p>
      </div>
    </figcaption>
  );
}

function CatalogGrid({ masters }: { masters: Master[] }) {
  return (
    <section
      id="catalog"
      className="scroll-mt-28 border-t border-[#E6E4DF] px-6 py-16 md:px-12 md:py-20 lg:px-16"
    >
      <div className="mb-14 flex items-baseline justify-between gap-6">
        <h2 className="text-4xl font-light tracking-tight">Каталог</h2>
        <p className="text-[11px] uppercase tracking-[0.22em]">{countLabel(masters.length)}</p>
      </div>
      <ul
        className={`grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 ${masters.length > 2 ? "xl:grid-cols-3" : ""}`}
      >
        {masters.map((master, index) => (
          <li key={master.id}>
            <figure>
              <WorkImage
                src={imageFor(master, index)}
                alt={[master.name, master.specialization, master.city].filter(Boolean).join(", ")}
                className="aspect-[4/3] w-full object-cover object-center"
              />
              <MasterLabel master={master} index={index} />
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CatalogNotice({ children }: { children: ReactNode }) {
  return (
    <section
      id="catalog"
      className="scroll-mt-28 border-t border-[#E6E4DF] px-6 py-16 md:px-12 lg:px-16"
    >
      <h2 className="text-4xl font-light tracking-tight">Каталог</h2>
      <p className="mt-6 max-w-md text-sm leading-relaxed">{children}</p>
    </section>
  );
}

function CatalogFallback() {
  return (
    <section className="border-t border-[#E6E4DF] px-6 py-16 md:px-12 lg:px-16">
      <h2 className="text-4xl font-light tracking-tight">Каталог</h2>
      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        <div className="aspect-[4/3] bg-[#F5F4F0]" />
        <div className="hidden aspect-[4/3] bg-[#F5F4F0] md:block" />
      </div>
    </section>
  );
}

async function MasterCatalog() {
  let response: Response;

  try {
    response = await fetch("http://127.0.0.1:8000/api/catalog/", {
      cache: "no-store",
    });
  } catch {
    return <CatalogNotice>Каталог временно недоступен.</CatalogNotice>;
  }

  if (!response.ok) {
    return (
      <CatalogNotice>Каталог временно недоступен. HTTP {response.status}</CatalogNotice>
    );
  }
  const products = await response.json();

  const catalog: Master[] = products.map(
    (product: {
      id: number;
      title: string;
      price: string;
      seller_name: string;
      avatar?: string | null;
      image?: string | null;
      sphere?: string;

    }) => ({
      id: product.id,
      name: product.title,
      specialization: product.seller_name,
      city: product.sphere ?? "",
      price: new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(Number(product.price)),
      image: product.image || undefined,
      avatar: product.avatar || undefined,
    })
  );

  if (catalog.length === 0) {
    return <CatalogNotice>В каталоге пока нет товаров.</CatalogNotice>;
  }

  return <CatalogGrid masters={catalog} />;
}

function Collections() {
  return (
    <section id="projects" className="scroll-mt-28 bg-[#F5F4F0] px-6 py-20 md:px-12 md:py-28 lg:px-16">
      <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em]">Подборки</p>
          <h2 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">Проекты</h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed">
          Интерьеры и реализованные проекты.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-14 lg:grid-cols-12">
        {collections.map((item) => (
          <article key={item.title} className={item.frame}>
            <WorkImage src={item.src} alt={item.title} className={item.image} />
            <div className="mt-4 flex items-baseline justify-between gap-4">
              <h3 className="text-xl font-light">{item.title}</h3>
              <p className="text-[11px] uppercase tracking-[0.16em]">{item.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RequestBand() {
  return (
    <section id="request" className="scroll-mt-28 px-6 py-20 md:px-12 md:py-28 lg:px-16">
      <div className="grid grid-cols-1 items-end gap-10 border-t border-[#E6E4DF] pt-12 lg:grid-cols-12">
        <p className="text-[11px] uppercase tracking-[0.28em] lg:col-span-3">Заявка</p>
        <p className="text-4xl font-light leading-tight tracking-tight md:text-5xl lg:col-span-6">
          Обсудите проект с мастером из каталога.
        </p>
        <div className="lg:col-span-3 lg:text-right">
          <a
            href="#catalog"
            className={`inline-block border border-[#1A1A1A] px-6 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[#1A1A1A] hover:text-white ${focusRing}`}
          >
            К каталогу
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <SiteShell>
      <Suspense fallback={<StageFallback />}>
        <MastersWindow />
      </Suspense>
      <Suspense fallback={<CatalogFallback />}>
        <MasterCatalog />
      </Suspense>
      <Collections />
      <RequestBand />
    </SiteShell>
  );
}
