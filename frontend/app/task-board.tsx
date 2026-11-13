"use client";

import { useEffect, useState } from "react";
import { getImageUrl } from "./media-url";

type TaskCard = {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_label: string;
  deadline: string;
  status_label: string;
  customer_name: string;
  responses_count: number;
  images: string[];
};

const tabs = [
  ["open", "Открытые"],
  ["in_progress", "В работе"],
  ["closed", "Закрытые"],
] as const;

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

const boxButton = `inline-flex min-h-11 items-center justify-center border px-4 text-[12px] uppercase tracking-[0.14em] ${focusRing}`;

export function TaskBoard() {
  const [status, setStatus] = useState<(typeof tabs)[number][0]>("open");
  const [tasks, setTasks] = useState<TaskCard[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch(`/api/tasks?status=${status}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("no");
        }
        return response.json();
      })
      .then((data: TaskCard[]) => setTasks(data))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }
        setTasks(null);
        setError("Лента задач временно недоступна.");
      });
    return () => controller.abort();
  }, [status]);

  return (
    <section className="px-[1.875rem] py-8 md:px-[16.8rem] md:py-10">
      <div className="border border-[#E6E6E6] bg-white px-6 py-12 text-center md:px-10 md:py-16">
        <h1 className="font-[family-name:var(--font-wordmark)] text-6xl font-medium lowercase leading-none tracking-tight sm:text-7xl md:text-8xl">
          задачи
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#767676]">
          Опишите работу — художники откликнутся со своей ценой и сроками.
        </p>
        <a
          href="/tasks/new"
          className={`${boxButton} mt-6 border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F4]`}
        >
          Создать задачу
        </a>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {tabs.map(([value, label]) => {
          const active = value === status;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(value)}
              className={`${boxButton} ${
                active
                  ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                  : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border border-[#E6E6E6] bg-white px-4 md:px-6">
        {error ? <p className="py-10 text-sm leading-7 text-[#767676]">{error}</p> : null}
        {tasks && tasks.length === 0 ? <p className="py-10 text-sm leading-7 text-[#767676]">Задач пока нет.</p> : null}
        {tasks && tasks.length > 0 ? (
          <ul>
            {tasks.map((task) => (
              <li key={task.id} className="border-t border-[#E6E6E6] py-6 first:border-t-0">
                <a href={`/tasks/${task.id}`} className={`grid gap-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] ${focusRing}`}>
                  {task.images[0] ? (
                    <img src={getImageUrl(task.images[0])} alt="" className="aspect-[4/5] w-full bg-[#F4F4F4] object-cover" />
                  ) : (
                    <span className="block aspect-[4/5] w-full bg-[#F4F4F4]" />
                  )}
                  <span className="block min-w-0">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">
                      {task.status_label} · {task.category}
                    </span>
                    <span className="mt-3 block font-[family-name:var(--font-display)] text-4xl font-light leading-none">
                      {task.title}
                    </span>
                    <span className="mt-4 block max-w-2xl text-sm font-light leading-7 text-[#1A1A1A]/75">
                      {task.description}
                    </span>
                    <span className="mt-4 block text-sm font-light text-[#1A1A1A]/70">
                      {[task.customer_name, task.budget_label, task.deadline, repliesLabel(task.responses_count)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function repliesLabel(count: number) {
  const value = Math.abs(count) % 100;
  const last = value % 10;
  if (value > 10 && value < 20) {
    return `${count} откликов`;
  }
  if (last === 1) {
    return `${count} отклик`;
  }
  if (last > 1 && last < 5) {
    return `${count} отклика`;
  }
  return `${count} откликов`;
}
