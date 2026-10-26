"use client";

import { useMemo, useState } from "react";
import { MasterCard, mastersCount } from "./master-card";
import type { StageMaster } from "./master-stage";

const roles = ["Мастер", "Дизайнер", "Архитектор"];

export function MastersCatalogList({ masters }: { masters: StageMaster[] }) {
  const [role, setRole] = useState("Все");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("ru");
  const visible = useMemo(
    () =>
      masters.filter((master) => {
        const sameRole = role === "Все" || master.role === role;
        const sameName = needle.length === 0 || master.owner.toLocaleLowerCase("ru").includes(needle);
        return sameRole && sameName;
      }),
    [masters, role, needle]
  );

  return (
    <>
      <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex flex-wrap gap-2">
          {["Все", ...roles].map((item) => {
            const active = item === role;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] ${
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
          placeholder="Имя"
          aria-label="Поиск по имени"
          className="w-48 border-b border-[#E7E1D8] bg-transparent py-2 text-sm font-light outline-none placeholder:text-[#1A1A1A]/35"
        />
        <p className="ml-auto pb-2 text-[11px] font-light uppercase tracking-[0.22em] text-[#1A1A1A]/45">
          {mastersCount(visible.length)}
        </p>
      </div>
      {visible.length === 0 ? (
        <p className="mt-16 text-sm font-light leading-7">Никого не нашлось.</p>
      ) : (
        <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-20 md:grid-cols-2">
          {visible.map((master, index) => (
            <MasterCard
              key={`${master.userId}-${master.id}`}
              name={master.owner}
              role={master.role}
              avatar={master.avatar}
              images={master.images}
              description={master.description}
              href={`/masters/${master.userId}`}
              index={index}
            />
          ))}
        </div>
      )}
    </>
  );
}
