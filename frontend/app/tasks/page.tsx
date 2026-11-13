import type { Metadata } from "next";
import { SiteShell } from "../site-shell";
import { TaskBoard } from "../task-board";

export const metadata: Metadata = {
  title: "naidista — Задачи",
  description: "Открытые задачи заказчиков naidista.",
};

export default function TasksPage() {
  return (
    <SiteShell>
      <TaskBoard />
    </SiteShell>
  );
}
