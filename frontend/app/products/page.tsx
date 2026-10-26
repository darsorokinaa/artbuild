import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsCatalog } from "../products-window";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "ArtBuild — Товары",
  description: "Каталог товаров ArtBuild.",
};

export default function ProductsPage() {
  return (
    <SiteShell>
      <Suspense fallback={<p className="px-6 py-16 text-sm font-light md:px-12 lg:px-16">Загрузка</p>}>
        <ProductsCatalog />
      </Suspense>
    </SiteShell>
  );
}
