"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "./account-provider";
import { workCategories } from "./work-categories";

const fieldClass =
  "mt-1 w-full border-b border-[#1A1A1A]/20 bg-transparent pb-1.5 pt-0.5 text-[15px] font-light outline-none";

const buttonClass =
  "bg-[#1A1A1A] px-6 py-2 text-[11px] font-light uppercase tracking-[0.28em] text-white disabled:opacity-40";

export function TaskForm() {
  const router = useRouter();
  const { user, token, ready } = useAccount();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new FormData(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Не удалось опубликовать задачу.");
        return;
      }
      router.push(`/tasks/${data.id}`);
    } catch {
      setError("Публикация временно недоступна.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="px-9 py-12 md:px-[25.2rem] md:py-16 lg:px-[33.6rem]">
      <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/55">Задачи</p>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-6xl font-light leading-none md:text-7xl">
        Новая задача
      </h1>
      {!ready ? null : !user ? (
        <p className="mt-8 text-sm font-light leading-7">
          Войдите как заказчик, чтобы описать задачу.{" "}
          <a href="/login" className="underline">
            Вход
          </a>
          {" · "}
          <a href="/register?kind=customer" className="underline">
            Регистрация
          </a>
        </p>
      ) : user.role !== "customer" ? (
        <p className="mt-8 max-w-xl text-sm font-light leading-7">
          Задачи создают заказчики. Художник может посмотреть{" "}
          <a href="/tasks" className="underline">
            открытые задачи
          </a>{" "}
          и откликнуться.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-10 grid max-w-xl gap-6">
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Название</span>
            <input name="title" required maxLength={300} className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Описание</span>
            <textarea name="description" required rows={6} className={`${fieldClass} resize-y`} />
          </label>
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Категория</span>
            <select name="category" required defaultValue="" className={fieldClass}>
              <option value="" disabled>
                Выберите
              </option>
              {workCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-6 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <label className="block">
              <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Бюджет</span>
              <select name="budget_kind" defaultValue="fixed" className={fieldClass}>
                <option value="fixed">Фикс</option>
                <option value="up_to">До</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Сумма, ₽</span>
              <input name="budget" required inputMode="decimal" className={fieldClass} />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Сроки</span>
            <input name="deadline" required maxLength={100} placeholder="например, 3 недели" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Референсы</span>
            <input name="photos" type="file" accept="image/*" multiple className="mt-3 block w-full text-sm font-light" />
            <span className="mt-2 block text-[13px] leading-5 text-[#1A1A1A]/55">Необязательно. Можно приложить несколько фотографий.</span>
          </label>
          {error ? <p className="text-sm font-light leading-7">{error}</p> : null}
          <div className="flex items-center justify-between gap-4">
            <a href="/tasks" className="text-[11px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/55">
              К ленте
            </a>
            <button type="submit" disabled={pending} className={buttonClass}>
              Опубликовать
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
