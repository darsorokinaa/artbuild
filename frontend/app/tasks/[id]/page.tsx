import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "../../site-shell";
import { TaskView } from "../../task-view";

export const metadata: Metadata = {
  title: "naidista — Задача",
  description: "Задача заказчика и отклики художников.",
};

export default function TaskPage() {
  return (
    <SiteShell>
      <Suspense fallback={<p className="px-[1.875rem] py-8 text-sm font-light md:px-[16.8rem]">Загрузка задачи</p>}>
        <TaskView />
      </Suspense>
    </SiteShell>
  );
}
