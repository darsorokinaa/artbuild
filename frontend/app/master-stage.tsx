"use client";

import { useState } from "react";
import { getImageUrl } from "./media-url";

export type StagePhoto = {
  src: string;
  description: string;
};

export type StageMaster = {
  id: number;
  userId: number;
  title: string;
  owner: string;
  role: string;
  avatar?: string;
  description?: string;
  image?: string;
  images: StagePhoto[];
  duration?: string;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

export function MasterStage({ masters }: { masters: StageMaster[] }) {
  const [index, setIndex] = useState(0);
  const [photo, setPhoto] = useState(0);
  const count = masters.length;
  const current = masters[index];
  const pictures = current.images.length
    ? current.images
    : current.image
      ? [{ src: current.image, description: current.title }]
      : [];
  const frame = pictures[photo] ?? pictures[0];

  function show(next: number) {
    setIndex((next + count) % count);
    setPhoto(0);
  }

  return (
    <section id="masters" className="scroll-mt-28 px-6 pb-16 pt-8 md:px-12 lg:px-16">
      <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-12">
        <figure className="relative lg:col-span-8">
          {frame ? (
            <img
              src={getImageUrl(frame.src)}
              alt={frame.description || current.title || current.owner}
              className="aspect-[4/3] w-full bg-[#E6E4DF] object-cover object-center"
            />
          ) : (
            <div className="aspect-[4/3] bg-white" />
          )}
          {pictures.length > 1 ? (
            <div className="absolute inset-x-0 bottom-0 flex gap-2 p-3">
              {pictures.map((item, itemIndex) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => setPhoto(itemIndex)}
                  aria-current={itemIndex === photo ? "true" : undefined}
                  aria-label={item.description || `Фото ${itemIndex + 1}`}
                  className={`h-16 w-24 shrink-0 bg-[#E6E4DF] ${
                    itemIndex === photo ? "outline outline-1 outline-white" : "opacity-70"
                  } ${focusRing}`}
                >
                  <img src={getImageUrl(item.src)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </figure>
        <div className="lg:col-span-4 lg:pb-1">
          <div className="flex items-end gap-4">
            {current.avatar ? (
              <img
                src={getImageUrl(current.avatar)}
                alt=""
                className="h-8 w-8 shrink-0 bg-[#E6E4DF] object-cover object-top"
              />
            ) : null}
            <p className="min-w-0 flex-1 text-4xl font-light tracking-tight">{current.owner}</p>
            <a
              href={`/masters/${current.userId}`}
              className={`mb-1 shrink-0 bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] text-[#F6F3EE] transition-opacity hover:opacity-80 ${focusRing}`}
            >
              К мастеру
            </a>
          </div>
          {current.title ? <p className="mt-4 text-sm">{current.title}</p> : null}
          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[#E6E4DF] pt-3 text-sm">
            <p>{current.role}</p>
            {current.duration ? (
              <p className="shrink-0 text-[11px] uppercase tracking-[0.16em]">{current.duration}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between gap-6 border-t border-[#E6E4DF] pt-6">
        <button
          type="button"
          onClick={() => show(index - 1)}
          className={`text-[11px] uppercase tracking-[0.2em] ${focusRing}`}
        >
          ←
        </button>
        <p className="text-[11px] uppercase tracking-[0.22em]">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={() => show(index + 1)}
          className={`text-[11px] uppercase tracking-[0.2em] ${focusRing}`}
        >
          →
        </button>
      </div>
    </section>
  );
}
