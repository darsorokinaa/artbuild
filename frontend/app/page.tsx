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

const pathClass = `inline-flex min-h-20 min-w-56 items-center justify-center border px-12 text-lg uppercase tracking-[0.2em] sm:min-w-72 sm:text-xl ${focusRing}`;

const columns = [
  { href: "/products", label: "Каталог", image: "/home-card-1.png", position: "object-left" },
  { href: "/masters", label: "Мастера", image: "/home-card-2.png", position: "object-center" },
  { href: "/products", label: "Новинки", image: "/home-card-1.png", position: "object-right" },
  { href: "/about", label: "О нас", image: "/home-card-2.png", position: "object-[35%_center]" },
] as const;

export default function Home() {
  return (
    <SiteShell>
      <div className="px-5 py-8 md:px-8 md:py-10">
        <section className="relative min-h-[42vh] overflow-hidden border border-[#E6E6E6] px-6 py-16 text-center md:min-h-[48vh] md:py-24">
          <video
            src="/hero.mp4"
            poster="/hero.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F4F4F4]/45 via-[#F4F4F4]/15 to-transparent" />
          <div className="relative">
            <h1 className="font-[family-name:var(--font-wordmark)] text-6xl font-medium lowercase leading-none tracking-tight text-white/70 sm:text-7xl md:text-8xl">
              naidista
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-white/90">
              Заказывай, покупай и продавай искусство
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-5">
          {paths.map((item) => (
            <a key={item.label} href={item.href} className={`${pathClass} ${item.tone}`}>
              {item.label}
            </a>
          ))}
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {columns.map((column) => (
            <li key={column.label}>
              <a href={column.href} className={`group relative block ${focusRing}`}>
                <img
                  src={column.image}
                  alt=""
                  className={`h-[46vh] min-h-64 w-full bg-[#E6E6E6] object-cover md:h-[52vh] ${column.position}`}
                />
                <span className="absolute bottom-4 right-4 inline-flex min-h-10 items-center border border-[#E6E6E6] bg-white px-4 text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]">
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
