import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsCatalog } from "../products-window";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "blurrr — Изделия",
  description: "Каталог изделий blurrr.",
};

export default function ProductsPage() {
  return (
    <SiteShell>
      <Suspense fallback={<CatalogSkeleton />}>
        <ProductsCatalog />
      </Suspense>
    </SiteShell>
  );
}

function CatalogSkeleton() {
  return (
    <section className="mx-auto w-full max-w-[1680px] px-4 py-12 sm:px-8 lg:px-10 lg:py-16" aria-hidden="true">
      <div className="h-3 w-40 bg-[#E7E1D8]" />
      <div className="mt-6 h-16 w-full max-w-xl bg-[#E7E1D8]" />
      <div className="mt-5 h-6 w-full max-w-md bg-[#E7E1D8]" />
      <ul className="mt-16 grid grid-cols-1 gap-x-4 gap-y-12 min-[520px]:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
        {["one", "two", "three", "four", "five", "six"].map((item) => (
          <li key={item}>
            <div className="aspect-[3/4] bg-[#E7E1D8]" />
            <div className="mt-4 h-6 w-2/3 bg-[#E7E1D8]" />
            <div className="mt-3 h-4 w-1/3 bg-[#E7E1D8]" />
          </li>
        ))}
      </ul>
    </section>
  );
}
