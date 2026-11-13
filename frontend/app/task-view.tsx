"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "./account-provider";
import { getImageUrl } from "./media-url";

type Reply = {
  id: number;
  price: string;
  deadline: string;
  message: string;
  status: string;
  status_label: string;
  artist_id: number;
  artist_name: string;
  images: string[];
};

type TaskDetail = {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_label: string;
  deadline: string;
  status: string;
  status_label: string;
  customer_id: number;
  customer_name: string;
  assignee_id: number | null;
  assignee_name: string;
  images: string[];
  responses_count?: number;
  mine: boolean;
  responses?: Reply[];
  my_response?: Reply;
};

const fieldClass =
  "mt-1 w-full border-b border-[#1A1A1A]/20 bg-transparent pb-1.5 pt-0.5 text-[15px] font-light outline-none";

const buttonClass =
  "bg-[#1A1A1A] px-6 py-2 text-[11px] font-light uppercase tracking-[0.28em] text-white disabled:opacity-40";

const quietClass =
  "border border-[#1A1A1A] bg-white px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] disabled:opacity-40";

const sellerRoles = new Set(["master", "designer", "architect", "organization"]);

function money(price: string) {
  const value = Number(price);
  if (!Number.isFinite(value)) {
    return price;
  }
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${digits} ₽`;
}

export function TaskView() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, token, ready } = useAccount();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!ready || !id) {
      return;
    }
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    fetch(`/api/tasks/${id}`, { headers })
      .then(async (response) => {
        if (response.status === 404) {
          setTask(null);
          setError("Задача не найдена.");
          return null;
        }
        if (!response.ok) {
          throw new Error("no");
        }
        return response.json();
      })
      .then((data: TaskDetail | null) => {
        if (data) {
          setError("");
          setTask(data);
        }
      })
      .catch(() => setError("Задача временно недоступна."));
  }, [ready, token, id]);

  async function choose(responseId: number) {
    setPending(true);
    setFormError("");
    try {
      const response = await fetch(`/api/tasks/${id}/choose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response_id: responseId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.detail || "Не удалось выбрать исполнителя.");
        return;
      }
      setTask(data);
    } catch {
      setFormError("Не удалось выбрать исполнителя.");
    } finally {
      setPending(false);
    }
  }

  async function closeTask() {
    setPending(true);
    setFormError("");
    try {
      const response = await fetch(`/api/tasks/${id}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.detail || "Не удалось закрыть задачу.");
        return;
      }
      setTask(data);
    } catch {
      setFormError("Не удалось закрыть задачу.");
    } finally {
      setPending(false);
    }
  }

  async function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setFormError("");
    try {
      const response = await fetch(`/api/tasks/${id}/responses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new FormData(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.detail || "Не удалось отправить отклик.");
        return;
      }
      setTask((current) => (current ? { ...current, my_response: data, responses_count: current.responses_count } : current));
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const fresh = await fetch(`/api/tasks/${id}`, { headers });
      if (fresh.ok) {
        setTask(await fresh.json());
      }
    } catch {
      setFormError("Не удалось отправить отклик.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="px-[1.875rem] py-8 md:px-[16.8rem] md:py-10">
      <a href="/tasks" className="text-[11px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/55">
        Все задачи
      </a>
      {error ? <p className="mt-8 text-sm font-light leading-7">{error}</p> : null}
      {task ? (
        <article className="mt-6 border border-[#E6E6E6] bg-white px-6 py-8 md:px-10 md:py-12">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">
            {task.status_label} · {task.category}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-light leading-none md:text-6xl">
            {task.title}
          </h1>
          <p className="mt-6 text-sm font-light text-[#1A1A1A]/70">
            {task.customer_name} · {task.budget_label} · {task.deadline}
          </p>
          {task.images.length > 0 ? (
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {task.images.map((src) => (
                <li key={src}>
                  <img src={getImageUrl(src)} alt="" className="aspect-[4/5] w-full bg-[#F4F4F4] object-cover" />
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-8 max-w-2xl whitespace-pre-wrap text-sm font-light leading-7">{task.description}</p>
          {task.assignee_id ? (
            <p className="mt-6 text-sm font-light leading-7">
              Исполнитель:{" "}
              <a href={`/masters/${task.assignee_id}`} className="underline">
                {task.assignee_name}
              </a>
            </p>
          ) : null}

          {task.mine ? (
            <section className="mt-12 border-t border-[#E6E6E6] pt-8">
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-light">Отклики</h2>
              {(task.responses ?? []).length === 0 ? (
                <p className="mt-4 text-sm font-light leading-7">Откликов пока нет.</p>
              ) : (
                <ul className="mt-4 max-w-2xl">
                  {(task.responses ?? []).map((reply) => (
                    <li key={reply.id} className="border-t border-[#E6E6E6] py-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <a href={`/masters/${reply.artist_id}`} className="font-[family-name:var(--font-display)] text-2xl font-light underline">
                          {reply.artist_name}
                        </a>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{reply.status_label}</span>
                      </div>
                      <p className="mt-2 text-sm font-light text-[#1A1A1A]/70">
                        {money(reply.price)} · {reply.deadline}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm font-light leading-7">{reply.message}</p>
                      {reply.images.length > 0 ? (
                        <ul className="mt-4 flex flex-wrap gap-3">
                          {reply.images.map((src) => (
                            <li key={src}>
                              <img src={getImageUrl(src)} alt="" className="h-28 w-24 border border-[#E6E6E6] object-cover" />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {task.status === "open" && reply.status === "pending" ? (
                        <button type="button" disabled={pending} onClick={() => choose(reply.id)} className={`${buttonClass} mt-4`}>
                          Выбрать
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {task.status !== "closed" ? (
                <button type="button" disabled={pending} onClick={closeTask} className={`${quietClass} mt-8`}>
                  Закрыть задачу
                </button>
              ) : null}
            </section>
          ) : null}

          {!task.mine && task.my_response ? <OwnReply reply={task.my_response} /> : null}

          {!task.mine && !task.my_response && task.status === "open" ? (
            <section className="mt-12 max-w-xl border-t border-[#E6E6E6] pt-8">
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-light">Откликнуться</h2>
              {!ready ? null : !user ? (
                <p className="mt-4 text-sm font-light leading-7">
                  <a href="/login" className="underline">
                    Войдите
                  </a>
                  , чтобы отправить цену и сроки.
                </p>
              ) : !sellerRoles.has(user.role) ? (
                <p className="mt-4 text-sm font-light leading-7">Откликаться могут художники.</p>
              ) : (
                <form onSubmit={respond} className="mt-6 grid gap-6">
                  <label className="block">
                    <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Ваша цена, ₽</span>
                    <input name="price" required inputMode="decimal" className={fieldClass} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Сроки</span>
                    <input name="deadline" required maxLength={100} className={fieldClass} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Сообщение</span>
                    <textarea name="message" required rows={4} className={`${fieldClass} resize-y`} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Примеры работ</span>
                    <input name="examples" type="file" accept="image/*" multiple className="mt-3 block w-full text-sm font-light" />
                  </label>
                  <div>
                    <button type="submit" disabled={pending} className={buttonClass}>
                      Откликнуться
                    </button>
                  </div>
                </form>
              )}
            </section>
          ) : null}
          {formError ? <p className="mt-6 text-sm font-light leading-7">{formError}</p> : null}
        </article>
      ) : null}
    </section>
  );
}

function OwnReply({ reply }: { reply: Reply }) {
  return (
    <section className="mt-12 max-w-2xl border-t border-[#E6E6E6] pt-8">
      <h2 className="font-[family-name:var(--font-display)] text-4xl font-light">Ваш отклик</h2>
      <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{reply.status_label}</p>
      <p className="mt-3 text-sm font-light text-[#1A1A1A]/70">
        {money(reply.price)} · {reply.deadline}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm font-light leading-7">{reply.message}</p>
      {reply.images.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-3">
          {reply.images.map((src) => (
            <li key={src}>
              <img src={getImageUrl(src)} alt="" className="h-28 w-24 border border-[#E6E6E6] object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
