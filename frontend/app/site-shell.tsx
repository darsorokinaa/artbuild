import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { DialogsButton } from "./messenger";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-display",
});

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={`font-light tracking-wide underline-offset-4 hover:underline ${focusRing}`}>
      {children}
    </a>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#E7E1D8] bg-white/90 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 md:px-12 lg:px-16">
        <a
          href="/"
          className={`mr-auto text-[12px] font-light uppercase tracking-[0.42em] ${focusRing}`}
        >
          ArtBuild
        </a>
        <nav className="order-last flex w-full gap-6 text-[13px] font-light md:order-none md:w-auto">
          <TextLink href="/products">Товары</TextLink>
          <TextLink href="/#projects">Проекты</TextLink>
          <TextLink href="/masters">Мастера</TextLink>
        </nav>
        <a
          href="/#request"
          className={`text-[11px] font-light uppercase tracking-[0.22em] underline decoration-[#1A1A1A]/25 underline-offset-8 transition-colors hover:decoration-[#1A1A1A] ${focusRing}`}
        >
          Заявка
        </a>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-[#E7E1D8] py-6 pl-6 pr-24 text-[11px] font-light uppercase tracking-[0.22em] md:pl-12 md:pr-28 lg:pl-16 lg:pr-32">
      <span>ArtBuild</span>
      <span>Галерея мастеров</span>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div lang="ru" className={`${manrope.className} ${display.variable} min-h-screen bg-white text-[#1A1A1A]`}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <DialogsButton />
    </div>
  );
}
