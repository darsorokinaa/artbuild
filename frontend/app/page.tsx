import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { ProductTile, type ProductCardData } from "./product-card";
import { getImageUrl } from "./media-url";
import { Hero } from "./hero";
import { loadMasters } from "./masters-window";
import type { StageMaster } from "./master-stage";
import { SiteShell } from "./site-shell";

export const metadata: Metadata = {
  title: "blurrr",
  description: "Изделия и мастера: оставьте задание или покажите свои работы.",
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
  sellerId?: number;
  description?: string;
  productionTime?: string;
  category?: string;
  color?: string;
  texture?: string;
  material?: string[];
  style?: string;
  format?: string;
  subject?: string;
  dimensions?: string;
  weight?: string;
  madeToOrder?: boolean;
  rating?: number | null;
  reviews?: { id: number; author: string; rating: number; text: string }[];
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

function imageFor(master: Master, index: number) {
  if (master.image) {
    return master.image;
  }

  return workImages[index % workImages.length];
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

function productCard(master: Master, image?: string): ProductCardData {
  return {
    id: master.id,
    title: master.name,
    description: master.description,
    price: master.price,
    image,
    sphere: master.city,
    seller: master.specialization,
    sellerId: master.sellerId,
    avatar: master.avatar,
    productionTime: master.productionTime,
    category: master.category,
    color: master.color,
    texture: master.texture,
    material: master.material,
    style: master.style,
    format: master.format,
    subject: master.subject,
    dimensions: master.dimensions,
    weight: master.weight,
    madeToOrder: master.madeToOrder,
    rating: master.rating,
    reviews: master.reviews,
  };
}

function CatalogGrid({ masters }: { masters: Master[] }) {
  return (
    <section id="catalog" className="scroll-mt-28 px-5 py-16 md:px-8 md:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A]/45">Каталог</p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-medium leading-tight md:text-5xl">
            Изделия
          </h2>
        </div>
        <a href="/products" className="text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
          Все изделия →
        </a>
      </div>
      <ul className="columns-1 gap-x-5 sm:columns-2 xl:columns-3">
        {masters.map((master, index) => (
          <li key={master.id} className="mb-5 break-inside-avoid">
            <ProductTile product={productCard(master, imageFor(master, index))} />
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
      className="scroll-mt-28 px-5 py-16 md:px-8"
    >
      <h2 className="font-[family-name:var(--font-display)] text-4xl font-medium">Изделия</h2>
      <p className="mt-6 max-w-md text-sm leading-relaxed">{children}</p>
    </section>
  );
}

function CatalogFallback() {
  return (
    <section className="px-5 py-16 md:px-8">
      <h2 className="font-[family-name:var(--font-display)] text-4xl font-medium">Изделия</h2>
      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        <div className="aspect-[4/3] bg-white" />
        <div className="hidden aspect-[4/3] bg-white md:block" />
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
      description?: string;
      price: string;
      seller_id?: number | null;
      seller_name: string;
      avatar?: string | null;
      image?: string | null;
      sphere?: string;
      production_time?: string;
      dimensions?: string;
      weight?: string | null;
      made_to_order?: boolean;
      filters?: {
        category?: string;
        color?: string;
        texture?: string;
        material?: string[];
        style?: string;
        format?: string;
        subject?: string;
      };
      rating?: number | null;
      reviews?: { id: number; author: string; rating: number; text: string }[];
    }) => ({
      id: product.id,
      name: product.title,
      specialization: product.seller_name,
      city: product.sphere ?? "",
      description: product.description || "",
      productionTime: product.production_time || "",
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
      rating: product.rating ?? null,
      reviews: product.reviews ?? [],
      price: new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(Number(product.price)),
      image: product.image || undefined,
      avatar: product.avatar || undefined,
      sellerId: product.seller_id || undefined,
    })
  );

  if (catalog.length === 0) {
    return <CatalogNotice>Изделий пока нет.</CatalogNotice>;
  }

  return <CatalogGrid masters={catalog} />;
}

function specialization(role: string, title: string) {
  const text = title.toLocaleLowerCase("ru");
  let craft = "";
  if (/шкаф|стол|мебел|кресл/.test(text)) {
    craft = "Авторская мебель";
  } else if (/роспис|панно|живоп/.test(text)) {
    craft = "Живопись";
  } else if (/текстил|подуш|льн/.test(text)) {
    craft = "Текстиль";
  } else if (/светильник|светодизайн/.test(text)) {
    craft = "Светодизайн";
  } else if (role === "Архитектор") {
    craft = "Архитектура";
  } else if (role === "Дизайнер") {
    craft = "Интерьер";
  }
  return craft ? `${role} · ${craft}` : role;
}

function craftRank(role: string, title: string) {
  const line = specialization(role, title);
  if (line.includes("Живопись")) {
    return 0;
  }
  if (line.includes("мебель")) {
    return 1;
  }
  if (line.includes("Текстиль")) {
    return 2;
  }
  if (line.includes("Архитектура")) {
    return 3;
  }
  if (line.includes("Светодизайн")) {
    return 4;
  }
  return 5;
}

function featuredMasters(works: StageMaster[]) {
  const byUser = new Map<number, StageMaster>();
  for (const work of works) {
    if (!work.image || byUser.has(work.userId)) {
      continue;
    }
    byUser.set(work.userId, work);
  }
  const people = [...byUser.values()].sort(
    (left, right) => craftRank(left.role, left.title) - craftRank(right.role, right.title) || left.userId - right.userId,
  );
  const picked: StageMaster[] = [];
  const seen = new Set<number>();
  for (const person of people) {
    const rank = craftRank(person.role, person.title);
    if (seen.has(rank)) {
      continue;
    }
    seen.add(rank);
    picked.push(person);
    if (picked.length === 4) {
      break;
    }
  }
  return picked;
}

function CategoryRow({ works }: { works: StageMaster[] }) {
  const cards = featuredMasters(works);
  return (
    <section id="masters" className="scroll-mt-28 px-5 py-8 md:px-8">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-medium">Мастера</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#1A1A1A]/65">
            Люди, которые превращают идеи в уникальные вещи.
          </p>
        </div>
        <a href="/masters" className="shrink-0 text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
          Все мастера →
        </a>
      </div>
      {cards.length > 0 ? (
        <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
          {cards.map((work) => (
            <li key={work.userId} className="w-[78%] shrink-0 snap-start md:w-auto">
              <a href={`/masters/${work.userId}`} className="group block">
                <span className="relative block overflow-hidden rounded-lg">
                  <WorkImage
                    src={work.image ?? ""}
                    alt={work.owner || work.title}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  />
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="absolute right-3 top-3 h-4 w-4 fill-none stroke-white stroke-[1.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                  >
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </span>
                <span className="mt-3 block text-sm font-medium text-[#1A1A1A]">{work.owner}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-[#1A1A1A]/55">{specialization(work.role, work.title)}</span>
                {work.title ? <span className="mt-1 block text-[13px] leading-5 text-[#1A1A1A]/70">{work.title}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const steps = [
  ["01", "Опишите задание"],
  ["02", "Выберите мастера"],
  ["03", "Подберите изделие"],
  ["04", "Дождитесь работы"],
];

function CustomerPath({ images }: { images: string[] }) {
  const photos = [...images.filter(Boolean), ...workImages].slice(0, 4);
  return (
    <section className="px-3 pb-8 md:px-5">
      <div className="grid items-center gap-10 rounded-[28px] bg-white px-6 py-10 md:grid-cols-2 md:px-12 md:py-14">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A]/45">Заказчикам</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium leading-tight md:text-5xl">
            Задание
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#1A1A1A]/65">
            Опишите, что нужно сделать. Мастера увидят задание и предложат свои изделия.
          </p>
          <a href="/register?kind=customer" className="mt-8 inline-block rounded-full bg-[#1A1A1A] px-5 py-3 text-sm text-white">
            Оставить задание →
          </a>
        </div>
        <ol className="grid grid-cols-2 gap-3">
          {steps.map(([number, label], index) => (
            <li key={number} className="relative overflow-hidden rounded-2xl">
              <img src={getImageUrl(photos[index])} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-3 bottom-3 text-white">
                <p className="text-[11px] tracking-[0.16em] text-white/70">{number}</p>
                <p className="mt-1 text-sm leading-5">{label}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function MastersPath() {
  return (
    <section className="px-3 pb-8 md:px-5">
      <div className="rounded-[28px] bg-white px-6 py-10 md:flex md:items-end md:justify-between md:px-12 md:py-14">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A]/45">Мастерам</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium leading-tight md:text-5xl">
            Для мастеров
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#1A1A1A]/65">
            Добавьте портфолио и изделия. Заказчики найдут вас и оставят задание.
          </p>
        </div>
        <a href="/register?kind=master" className="mt-8 inline-block rounded-full bg-[#1A1A1A] px-5 py-3 text-sm text-white md:mt-0">
          Стать мастером →
        </a>
      </div>
    </section>
  );
}

function HomeFallback() {
  return (
    <div className="px-3 pt-2">
      <div className="min-h-[70vh] rounded-[28px] bg-[#E7E1D8]" />
    </div>
  );
}

async function HomePage() {
  const gallery = await loadMasters();
  const works = gallery ?? [];
  return (
    <>
      <Hero />
      <CategoryRow works={works} />
      <Suspense fallback={<CatalogFallback />}>
        <MasterCatalog />
      </Suspense>
      <CustomerPath images={works.map((work) => work.image).filter((image): image is string => Boolean(image))} />
      <MastersPath />
    </>
  );
}

export default function Home() {
  return (
    <SiteShell>
      <Suspense fallback={<HomeFallback />}>
        <HomePage />
      </Suspense>
    </SiteShell>
  );
}
