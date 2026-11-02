import { connection } from "next/server";
import { MastersCatalogList } from "./masters-catalog";
import { MasterStage, type StageMaster } from "./master-stage";

const roleLabel: Record<string, string> = {
  master: "Мастер",
  designer: "Дизайнер",
  architect: "Архитектор",
  organization: "Организация",
  customer: "Заказчик",
};

export function StageFallback() {
  return (
    <section className="px-5 py-8 md:px-8 md:py-10">
      <div className="min-h-[28rem] border border-[#E6E6E6] bg-white" />
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
        crafts?: string[];
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
          crafts: work.crafts ?? [],
        };
      }
    );

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
    <section className="px-5 py-8 md:px-8 md:py-10">
      <h1 className="sr-only">Мастера</h1>
      <div className="border border-[#E6E6E6] bg-white px-5 py-8 md:px-10 md:py-12">
        <MastersCatalogList masters={gallery} />
      </div>
    </section>
  );
}
