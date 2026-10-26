import type { ReactNode } from "react";
import { Bodoni_Moda, Cormorant_Garamond, Manrope } from "next/font/google";
import { AccountNav, AccountProvider, HeaderCta } from "./account-provider";
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

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={`text-[13px] text-[#1A1A1A]/70 hover:text-[#1A1A1A] ${focusRing}`}>
      {children}
    </a>
  );
}

function SectionLinks() {
  return (
    <>
      <TextLink href="/products">Изделия</TextLink>
      <TextLink href="/masters">Мастера</TextLink>
    </>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-[#F6F3EE]/90 backdrop-blur-sm">
      <div className="flex items-center gap-8 px-5 py-4 md:px-8">
        <a
          href="/"
          className={`font-[family-name:var(--font-wordmark)] text-[1.7rem] font-medium lowercase leading-none tracking-tight ${focusRing}`}
        >
          blurrr
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          <SectionLinks />
        </nav>
        <div className="ml-auto flex items-center gap-5">
          <span className="hidden md:inline-flex">
            <AccountNav />
          </span>
          <HeaderCta />
        </div>
      </div>
      <nav className="flex flex-wrap gap-x-5 gap-y-2 px-5 pb-3 md:hidden">
        <SectionLinks />
        <AccountNav />
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="flex items-center justify-between py-8 pl-6 pr-24 text-[12px] text-[#1A1A1A]/45 md:pl-8 md:pr-28">
      <span className="font-[family-name:var(--font-wordmark)] text-lg lowercase text-[#1A1A1A]">blurrr</span>
      <span>Изделия и мастера</span>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <div lang="ru" className={`${manrope.className} ${display.variable} ${wordmark.variable} min-h-screen bg-[#F6F3EE] text-[#1A1A1A]`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <DialogsButton />
      </div>
    </AccountProvider>
  );
}
