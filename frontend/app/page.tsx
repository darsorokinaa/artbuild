import type { Metadata } from "next";
import { SiteShell } from "./site-shell";

export const metadata: Metadata = {
  title: "naidista",
  description: "Заказывай, покупай и продавай искусство.",
};

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

const paths = [
  {
    href: "/products",
    label: "Покупаю",
    tone: "border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]",
  },
  {
    href: "/register?kind=master",
    label: "Продаю",
    tone: "border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F4]",
  },
] as const;

const pathClass = `inline-flex min-h-20 w-full items-center justify-center border px-6 text-lg uppercase tracking-[0.2em] sm:text-xl ${focusRing}`;

const columns = [
  { href: "/products", label: "Каталог", image: "/home-card-1.png", position: "object-left" },
  { href: "/masters", label: "Мастера", image: "/home-card-2.png", position: "object-center" },
  { href: "/products", label: "Новинки", image: "/home-card-1.png", position: "object-right" },
  { href: "/about", label: "О нас", image: "/home-card-2.png", position: "object-[35%_center]" },
] as const;

export default function Home() {
  return (
    <SiteShell>
      <div className="px-[1.875rem] py-8 md:px-[16.8rem] md:py-10">
        <section className="border border-[#E6E6E6] bg-white px-6 py-16 text-center md:py-20">
          <h1 className="font-[family-name:var(--font-wordmark)] text-6xl font-medium lowercase leading-none tracking-tight text-[#1A1A1A] sm:text-7xl md:text-8xl">
            naidista
          </h1>
          <p className="mt-4 font-[family-name:var(--font-wordmark)] text-lg font-medium leading-none text-[#1A1A1A] sm:mt-6 sm:text-xl">
            заказывай, покупай и продавай искусство
          </p>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <a href={paths[0].href} className={`${pathClass} ${paths[0].tone}`}>
            {paths[0].label}
          </a>
          <a href={paths[1].href} className={`${pathClass} ${paths[1].tone}`}>
            {paths[1].label}
          </a>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {columns.map((column) => (
            <li key={column.label}>
              <a href={column.href} className={`group relative block ${focusRing}`}>
                <img
                  src={column.image}
                  alt=""
                  className={`h-[46vh] min-h-64 w-full bg-[#E6E6E6] object-cover md:h-[52vh] ${column.position}`}
                />
                <span className="absolute bottom-0 right-0 z-10 inline-flex translate-x-3 items-center border border-[#E6E6E6] bg-white px-6 py-3 text-[16.5px] uppercase leading-none tracking-[0.16em] text-[#1A1A1A] lg:translate-x-4">
                  {column.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  );
}
