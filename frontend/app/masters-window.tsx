import { connection } from "next/server";
import { MastersCatalogList } from "./masters-catalog";
import { MasterStage, type StageMaster } from "./master-stage";

const roleLabel: Record<string, string> = {
  master: "Мастер",
  designer: "Дизайнер",
  architect: "Архитектор",
  customer: "Заказчик",
};

export function StageFallback() {
  return (
    <section className="px-6 py-8 md:px-12 lg:px-16">
      <div className="aspect-[4/3] bg-white lg:w-2/3" />
    </section>
  );
}

export async function loadMasters() {
  await connection();
  let response: Response;

  try {
    response = await fetch("http://127.0.0.1:8000/api/masters/", {
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const works = await response.json();
  const gallery: StageMaster[] = works
    .map(
      (work: {
        id: number;
        user_id: number;
        title?: string;
        name?: string;
        owner_name?: string;
        role?: string;
        avatar?: string | null;
        description?: string | null;
        image?: string | null;
        images?: { src: string; description?: string }[];
        duration?: string;
      }) => {
        const images =
          work.images && work.images.length > 0
            ? work.images.map((item) => ({
                src: item.src,
                description: item.description ?? "",
              }))
            : work.image
              ? [{ src: work.image, description: work.title ?? "" }]
              : [];

        return {
          id: work.id,
          userId: work.user_id,
          title: work.title ?? "",
          owner: work.name || work.owner_name || "",
          role: roleLabel[work.role ?? ""] ?? "Профиль",
          avatar: work.avatar || undefined,
          description: work.description || undefined,
          image: images[0]?.src,
          images,
          duration: work.duration || undefined,
  
        };
      }
    )
    .filter((work: StageMaster) => work.images.length > 0);

  return gallery;
}

export async function MastersWindow() {
  const gallery = await loadMasters();

  if (gallery === null) {
    return <p className="px-6 py-16 text-sm md:px-12 lg:px-16">Галерея временно недоступна.</p>;
  }

  if (gallery.length === 0) {
    return <p className="px-6 py-16 text-sm md:px-12 lg:px-16">Основных работ пока нет.</p>;
  }

  return <MasterStage masters={gallery} />;
}

export async function MastersCatalog() {
  const gallery = await loadMasters();

  if (gallery === null) {
    return <p className="px-6 py-16 text-sm md:px-12 lg:px-16">Каталог временно недоступен.</p>;
  }

  return (
    <section className="px-6 py-12 md:px-12 md:py-16 lg:px-16">
      <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/55">Каталог</p>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-7xl font-light leading-none tracking-tight md:text-8xl">
        Мастера
      </h1>
      {gallery.length === 0 ? (
        <p className="mt-16 text-sm font-light leading-7">Мастеров пока нет.</p>
      ) : (
        <MastersCatalogList masters={gallery} />
      )}
    </section>
  );
}
