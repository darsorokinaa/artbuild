import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsCatalog } from "../products-window";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "naidista — Изделия",
  description: "Каталог изделий naidista.",
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
    <section className="px-5 py-8 md:px-8" aria-hidden="true">
      <div className="h-48 border border-[#E6E6E6] bg-white" />
      <div className="mt-6 grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="h-72 bg-[#F4F4F4]" />
        <div className="h-72 border border-[#E6E6E6] bg-white" />
      </div>
    </section>
  );
}
