import type { Metadata } from "next";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "naidista — О нас",
  description: "naidista — заказывай, покупай и продавай искусство.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="px-[1.875rem] py-16 md:px-[16.8rem] md:py-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A]/45">О нас</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-medium leading-none md:text-6xl">naidista</h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-[#1A1A1A]/75">
          Здесь заказывают, покупают и продают искусство и авторские изделия. Мастера показывают работы, заказчики находят их и оставляют задание.
        </p>
      </section>
    </SiteShell>
  );
}
