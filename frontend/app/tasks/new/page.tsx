import type { Metadata } from "next";
import { SiteShell } from "../../site-shell";
import { TaskForm } from "../../task-form";

export const metadata: Metadata = {
  title: "naidista — Новая задача",
  description: "Описать задачу для художников naidista.",
};

export default function NewTaskPage() {
  return (
    <SiteShell>
      <TaskForm />
    </SiteShell>
  );
}
