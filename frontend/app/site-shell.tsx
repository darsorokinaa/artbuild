import type { ReactNode } from "react";
import { Bodoni_Moda, Cormorant_Garamond, Manrope } from "next/font/google";
import { AccountProvider } from "./account-provider";
import { DialogsButton } from "./messenger";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-display",
});

const wordmark = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-wordmark",
});

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

const menuClass = `inline-flex min-h-10 items-center justify-center border px-4 text-[12px] uppercase tracking-[0.14em] ${focusRing}`;

const menu = [
  {
    href: "/artist",
    label: "Я художник",
    tone: "border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]",
  },
  {
    href: "/register?kind=master&specialty=architect",
    label: "Я архитектор",
    tone: "border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F4]",
  },
  {
    href: "/products",
    label: "Ресейл",
    tone: "border-[#8A8A8A] bg-[#8A8A8A] text-white hover:bg-[#737373]",
  },
] as const;

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-[#F4F4F4]/90 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 md:gap-x-4 md:px-8">
        <a
          href="/"
          className={`mr-2 font-[family-name:var(--font-wordmark)] text-[1.7rem] font-medium lowercase leading-none tracking-tight ${focusRing}`}
        >
          naidista
        </a>
        <nav className="flex flex-wrap items-center gap-3">
          {menu.slice(0, 2).map((item) => (
            <a key={item.label} href={item.href} className={`${menuClass} ${item.tone}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <nav className="ml-auto">
          <a href={menu[2].href} className={`${menuClass} ${menu[2].tone}`}>
            {menu[2].label}
          </a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="flex items-center justify-between py-8 pl-6 pr-24 text-[12px] text-[#1A1A1A]/45 md:pl-8 md:pr-28">
      <span className="font-[family-name:var(--font-wordmark)] text-lg lowercase text-[#1A1A1A]">naidista</span>
      <span>Изделия и мастера</span>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <div lang="ru" className={`${manrope.className} ${display.variable} ${wordmark.variable} min-h-screen bg-[#F4F4F4] text-[#1A1A1A]`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <DialogsButton />
      </div>
    </AccountProvider>
  );
}
