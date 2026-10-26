import type { Metadata } from "next";
import { Suspense } from "react";
import { MastersCatalog, StageFallback } from "../masters-window";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "ArtBuild — Мастера",
  description: "Каталог мастеров ArtBuild: профили и основные работы.",
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
