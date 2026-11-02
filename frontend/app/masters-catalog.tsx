"use client";

import { useMemo, useState } from "react";
import { getImageUrl } from "./media-url";
import type { StageMaster } from "./master-stage";

const categories = ["Скульптура", "Живопись", "Декор", "Мебель", "Текстиль", "Посуда"] as const;

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

function craftOf(master: StageMaster) {
  const text = `${master.title} ${master.description ?? ""}`.toLocaleLowerCase("ru");
  if (/скульпт/.test(text)) {
    return "Скульптура";
  }
  if (/роспис|панно|живоп|картин/.test(text)) {
    return "Живопись";
  }
  if (/посуд|керамик|ваз|тарел|чаш/.test(text)) {
    return "Посуда";
  }
  if (/текстил|подуш|льн|ткан/.test(text)) {
    return "Текстиль";
  }
  if (/шкаф|стол|мебел|кресл|кроват/.test(text)) {
    return "Мебель";
  }
  if (/декор|светильник/.test(text)) {
    return "Декор";
  }
  return "";
}

function craftsOf(master: StageMaster) {
  if (master.crafts && master.crafts.length > 0) {
    return master.crafts;
  }
  const craft = craftOf(master);
  return craft ? [craft] : [];
}

function peopleOf(masters: StageMaster[]) {
  const seen = new Set<number>();
  return masters.filter((master) => {
    if (seen.has(master.userId)) {
      return false;
    }
    seen.add(master.userId);
    return true;
  });
}

export function MastersCatalogList({ masters }: { masters: StageMaster[] }) {
  const people = useMemo(() => peopleOf(masters), [masters]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("ru");
  const visible = people.filter((master) => {
    const crafts = craftsOf(master);
    const sameCategory = category === "" || crafts.includes(category);
    const haystack = `${master.owner} ${master.role} ${crafts.join(" ")}`.toLocaleLowerCase("ru");
    const sameQuery = needle.length === 0 || haystack.includes(needle);
    return sameCategory && sameQuery;
  });

  return (
    <div className="grid gap-8 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-x-10">
      <label className="block md:col-start-2">
        <span className="sr-only">Поиск</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск"
          aria-label="Поиск"
          className={`w-full min-h-12 border border-[#E6E6E6] bg-white px-4 text-sm uppercase tracking-[0.16em] text-[#1A1A1A] outline-none placeholder:text-[#1A1A1A]/45 ${focusRing}`}
        />
      </label>
      <aside className="flex flex-col gap-3 md:col-start-1 md:row-start-2">
        {categories.map((item) => {
          const active = item === category;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(active ? "" : item)}
              className={`min-h-12 border px-4 text-[12px] uppercase tracking-[0.16em] ${focusRing} ${
                active
                  ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                  : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </aside>
      {visible.length === 0 ? (
        <p className="text-sm leading-7 text-[#1A1A1A]/70 md:col-start-2 md:row-start-2 md:mt-8">Никого не нашлось.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 md:col-start-2 md:row-start-2 md:mt-10">
          {visible.map((master) => {
            const photo = master.avatar || master.image;
            const craft = craftsOf(master).join(", ");
            return (
              <li key={master.userId}>
                <a href={`/masters/${master.userId}`} className={`block text-center ${focusRing}`}>
                  {photo ? (
                    <img
                      src={getImageUrl(photo)}
                      alt=""
                      className="mx-auto h-32 w-32 rounded-full bg-[#E6E6E6] object-cover md:h-36 md:w-36"
                    />
                  ) : (
                    <span className="mx-auto block h-32 w-32 rounded-full bg-[#E6E6E6] md:h-36 md:w-36" />
                  )}
                  <span className="mt-4 block text-sm text-[#1A1A1A]">{master.owner}</span>
                  <span className="mt-1 block text-[13px] lowercase text-[#1A1A1A]/55">{craft || master.role}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
