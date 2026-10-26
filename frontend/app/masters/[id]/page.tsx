import type { Metadata } from "next";
import { Suspense } from "react";
import { MasterProfileBody, type ProfileProduct, type ProfileWork } from "../../master-profile";
import { getImageUrl } from "../../media-url";
import { SiteShell } from "../../site-shell";

type MasterProfile = {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  description?: string;
  portfolios: ProfileWork[];
  products: ProfileProduct[];
};

const roleLabel: Record<string, string> = {
  master: "Мастер",
  designer: "Дизайнер",
  architect: "Архитектор",
  customer: "Заказчик",
};

const display = "font-[family-name:var(--font-display)]";

async function loadMaster(id: string): Promise<MasterProfile | null | undefined> {
  let response: Response;

  try {
    response = await fetch(`http://127.0.0.1:8000/api/masters/${id}/`, {
      cache: "no-store",
    });
  } catch {
    return undefined;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return undefined;
  }

  const master = await response.json();
  return {
    id: master.id,
    name: master.name,
    role: roleLabel[master.role] ?? "Профиль",
    avatar: master.avatar || undefined,
    description: master.description || "",
    portfolios: (master.portfolios ?? []).map(
      (work: {
        id: number;
        title?: string;
        duration?: string;
        description?: string;
        image?: string | null;
        images?: { src: string; description?: string }[];
      }) => ({
        id: work.id,
        title: work.title ?? "",
        duration: work.duration || undefined,
        description: work.description || "",
        image: work.image || undefined,
        images: work.images ?? [],
      })
    ),
    products: (master.products ?? []).map(
      (product: {
        id: number;
        title?: string;
        description?: string;
        price?: string;
        image?: string | null;
        sphere?: string;
        production_time?: string;
        rating?: number | null;
        reviews?: { id: number; author: string; rating: number; text: string }[];
      }) => ({
        id: product.id,
        title: product.title ?? "",
        description: product.description || "",
        price: product.price,
        image: product.image || undefined,
        sphere: product.sphere || "",
        productionTime: product.production_time || "",
        rating: product.rating ?? null,
        reviews: product.reviews ?? [],
      })
    ),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const master = await loadMaster(id);
  return {
    title: master?.name ? `ArtBuild — ${master.name}` : "ArtBuild — Мастер",
  };
}

async function MasterProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const master = await loadMaster(id);

  if (master === undefined) {
    return <p className="px-6 py-16 text-sm font-light md:px-12 lg:px-16">Карточка временно недоступна.</p>;
  }

  if (master === null) {
    return <p className="px-6 py-16 text-sm font-light md:px-12 lg:px-16">Такого мастера нет.</p>;
  }

  return (
    <article className="px-6 py-12 md:px-12 md:py-16 lg:px-16">
      <a
        href="/masters"
        className="text-[11px] font-light uppercase tracking-[0.22em] underline decoration-[#1A1A1A]/25 underline-offset-8 hover:decoration-[#1A1A1A]"
      >
        Все мастера
      </a>
      <div className="mt-10 flex items-end gap-5">
        {master.avatar ? (
          <img
            src={getImageUrl(master.avatar)}
            alt=""
            className="h-20 w-20 bg-[#E7E1D8] object-cover object-top"
          />
        ) : null}
        <div>
          <p className="text-[11px] font-light uppercase tracking-[0.28em] text-[#1A1A1A]/55">
            {master.role}
          </p>
          <h1 className={`${display} mt-3 text-6xl font-light leading-none tracking-tight md:text-8xl`}>
            {master.name}
          </h1>
        </div>
      </div>
      {master.description ? (
        <p className="mt-8 max-w-2xl text-sm font-light leading-7">{master.description}</p>
      ) : null}
      <MasterProfileBody
        portfolios={master.portfolios}
        products={master.products}
        authorName={master.name}
        authorId={master.id}
      />
    </article>
  );
}

export default function MasterPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <SiteShell>
      <Suspense fallback={<p className="px-6 py-16 text-sm font-light md:px-12 lg:px-16">Загрузка</p>}>
        <MasterProfile params={params} />
      </Suspense>
    </SiteShell>
  );
}
