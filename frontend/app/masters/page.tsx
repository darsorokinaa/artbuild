import type { Metadata } from "next";
import { Suspense } from "react";
import { MastersCatalog, StageFallback } from "../masters-window";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "naidista — Мастера",
  description: "Каталог мастеров naidista: профили и работы.",
};

export default function MastersPage() {
  return (
    <SiteShell>
      <Suspense fallback={<StageFallback />}>
        <MastersCatalog />
      </Suspense>
    </SiteShell>
  );
}
