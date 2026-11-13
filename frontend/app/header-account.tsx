"use client";

import { useAccount } from "./account-provider";

const linkClass =
  "inline-flex min-h-10 items-center justify-center border border-[#1A1A1A] bg-white px-4 text-[12px] uppercase tracking-[0.14em] text-[#1A1A1A] hover:bg-[#F4F4F4] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

export function HeaderAccountLink() {
  const { user, ready } = useAccount();
  if (!ready) {
    return <span className="inline-flex min-h-10 min-w-24" aria-hidden="true" />;
  }
  if (!user || user.role === "guest") {
    return (
      <a href="/login" className={linkClass}>
        Вход
      </a>
    );
  }
  return (
    <a href="/account" className={linkClass}>
      Кабинет
    </a>
  );
}
