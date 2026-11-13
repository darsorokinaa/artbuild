"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "./account-provider";
import { workCategories } from "./work-categories";

const fieldClass =
  "mt-1 w-full border-b border-[#1A1A1A]/20 bg-transparent pb-1.5 pt-0.5 text-[15px] font-light outline-none";

const buttonClass =
  "bg-[#1A1A1A] px-6 py-2 text-[11px] font-light uppercase tracking-[0.28em] text-white disabled:opacity-40";

const sellerRoles = new Set(["master", "designer", "architect", "organization"]);

export function ProductForm({
  embedded = false,
  onCreated,
}: {
  embedded?: boolean;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const { user, token, ready } = useAccount();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    const photos = body.getAll("photos").filter((item) => item instanceof File && item.size > 0);
    if (photos.length === 0) {
      setError("Добавьте хотя бы одну фотографию.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Не удалось выложить товар.");
        return;
      }
      if (onCreated) {
        onCreated();
        return;
      }
      router.push("/products");
    } catch {
      setError("Публикация временно недоступна.");
    } finally {
      setPending(false);
    }
  }

  const form = (
    <>
      {!ready ? null : !user ? (
        <p className="mt-8 text-sm font-light leading-7">
          Войдите как художник, чтобы выложить работу.{" "}
          <a href="/login" className="underline">
            Вход
          </a>
        </p>
      ) : !sellerRoles.has(user.role) ? (
        <p className="mt-8 max-w-xl text-sm font-light leading-7">
          Товары выкладывают художники. Заказчик может{" "}
          <a href="/tasks/new" className="underline">
            создать задачу
          </a>
          .
        </p>
      ) : (
        <form onSubmit={submit} className="grid max-w-xl gap-6">
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Фотографии</span>
            <input name="photos" type="file" accept="image/*" multiple required className="mt-3 block w-full text-sm font-light" />
            <span className="mt-2 block text-[13px] leading-5 text-[#1A1A1A]/55">Первая фотография станет обложкой в каталоге.</span>
          </label>
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Название</span>
            <input name="title" required maxLength={300} className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Описание</span>
            <textarea name="description" required rows={5} className={`${fieldClass} resize-y`} />
          </label>
          <label className="block">
            <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Цена, ₽</span>
            <input name="price" required inputMode="decimal" className={fieldClass} />
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
          {error ? <p className="text-sm font-light leading-7">{error}</p> : null}
          <div className={`flex items-center gap-4 ${embedded ? "justify-end" : "justify-between"}`}>
            {embedded ? null : (
              <a href="/account" className="text-[11px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/55">
                В кабинет
              </a>
            )}
            <button type="submit" disabled={pending} className={buttonClass}>
              Опубликовать
            </button>
          </div>
        </form>
      )}
    </>
  );

  if (embedded) {
    return form;
  }

  return (
    <section className="px-9 py-12 md:px-[25.2rem] md:py-16 lg:px-[33.6rem]">
      <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/55">Каталог</p>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-6xl font-light leading-none md:text-7xl">
        Новый товар
      </h1>
      <div className="mt-10">{form}</div>
    </section>
  );
}
