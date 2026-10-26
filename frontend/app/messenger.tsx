"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getImageUrl } from "./media-url";

type DialogItem = {
  id: number;
  with_id: number;
  with_name: string;
  last_text: string;
};

type ChatLine = {
  id: number;
  text: string;
  mine: boolean;
  sender_name: string;
  title?: string;
  image?: string;
  description?: string;
  price?: string;
  production_time?: string;
};

type Thread = {
  id: number;
  with_id: number;
  with_name: string;
  me_name: string;
  dialogs: DialogItem[];
  messages: ChatLine[];
  draft?: {
    text: string;
    image?: string;
  };
};

type ProductDraft = {
  text: string;
  image?: string;
  dialogId: number;
};

const currentUserId = 4;

async function talk(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User": String(currentUserId),
      ...(init?.headers ?? {}),
    },
  });
}

export function ContactAuthor({
  productId,
  productTitle,
  authorName,
}: {
  productId: number;
  productTitle: string;
  authorName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] text-white"
      >
        Связаться с автором
      </button>
      {open ? (
        <Messenger
          productId={productId}
          productTitle={productTitle}
          authorName={authorName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function DialogsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Все диалоги"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center bg-[#1A1A1A] text-white"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.5]">
          <path d="M5 6.5h14v9H8.5L5 18.5z" />
        </svg>
      </button>
      {open ? <Messenger onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function Messenger({
  productId,
  productTitle = "",
  authorName = "",
  onClose,
}: {
  productId?: number;
  productTitle?: string;
  authorName?: string;
  onClose: () => void;
}) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    let ignore = false;
    const request = productId
      ? talk("/api/conversations", {
          method: "POST",
          body: JSON.stringify({ product_id: productId }),
        })
      : talk("/api/conversations");
    request
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("unavailable");
        }
        return response.json();
      })
      .then(async (data: Thread & { dialogs: DialogItem[] }) => {
        if (ignore) {
          return;
        }
        if (data.messages) {
          setThread(data);
          if (data.draft) {
            setDraft({ text: data.draft.text, image: data.draft.image, dialogId: data.id });
            setText(data.draft.text);
          }
          return;
        }
        const first = data.dialogs[0];
        if (!first) {
          setThread({
            id: 0,
            with_id: 0,
            with_name: "",
            me_name: "",
            dialogs: [],
            messages: [],
          });
          return;
        }
        const thread = await talk(`/api/conversations/${first.id}`);
        if (!ignore && thread.ok) {
          setThread(await thread.json());
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Мессенджер временно недоступен.");
        }
      });
    return () => {
      ignore = true;
    };
  }, [productId]);

  async function openDialog(id: number) {
    setError("");
    const kept = draft && thread?.id === draft.dialogId ? { ...draft, text } : draft;
    if (kept && kept !== draft) {
      setDraft(kept);
    }
    const response = await talk(`/api/conversations/${id}`);
    if (!response.ok) {
      setError("Диалог не открылся.");
      return;
    }
    setThread(await response.json());
    setText(kept && id === kept.dialogId ? kept.text : "");
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || !thread || sending) {
      return;
    }
    setSending(true);
    setError("");
    try {
      const withDraft = draft && thread.id === draft.dialogId;
      const response = await talk(`/api/conversations/${thread.id}`, {
        method: "POST",
        body: JSON.stringify({
          text: message,
          image: withDraft ? draft.image || "" : "",
        }),
      });
      if (!response.ok) {
        setError("Сообщение не отправилось.");
        return;
      }
      setThread(await response.json());
      setText("");
      if (withDraft) {
        setDraft(null);
      }
    } catch {
      setError("Сообщение не отправилось.");
    } finally {
      setSending(false);
    }
  }

  const title = thread?.with_name || authorName;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1A1A1A]/40">
      <button type="button" aria-label="Закрыть" className="absolute inset-0" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="messenger-title"
        className="relative z-10 flex h-full w-full max-w-3xl flex-col bg-white"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#E7E1D8] px-6 py-5">
          <div>
            <p className="text-[11px] font-light uppercase tracking-[0.22em] text-[#1A1A1A]/45">
              {thread?.me_name ? `Диалоги · ${thread.me_name}` : "Диалоги"}
            </p>
            <h2 id="messenger-title" className="mt-2 font-[family-name:var(--font-display)] text-4xl font-light leading-none">
              {title}
            </h2>
            {productTitle ? (
              <p className="mt-3 text-sm font-light leading-7 text-[#1A1A1A]/70">{productTitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[#1A1A1A]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.5]">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="w-52 shrink-0 overflow-y-auto border-r border-[#E7E1D8] py-2">
            {(thread?.dialogs ?? []).map((dialog) => (
              <button
                key={dialog.id}
                type="button"
                onClick={() => openDialog(dialog.id)}
                className={`block w-full px-4 py-3 text-left ${
                  dialog.id === thread.id ? "bg-[#F3F3F3]" : "hover:bg-[#F7F7F7]"
                }`}
              >
                <span className="block text-sm font-light">{dialog.with_name}</span>
                {dialog.last_text ? (
                  <span className="mt-1 block truncate text-[12px] font-light text-[#1A1A1A]/50">{dialog.last_text}</span>
                ) : null}
              </button>
            ))}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
              {error ? <p className="text-sm font-light leading-7">{error}</p> : null}
              {thread && thread.messages.length === 0 ? (
                <p className="text-sm font-light leading-7 text-[#1A1A1A]/70">Напишите первое сообщение.</p>
              ) : null}
              {thread?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] px-4 py-3 text-sm font-light leading-7 ${
                    message.mine ? "ml-auto bg-[#1A1A1A] text-white" : "bg-[#F3F3F3] text-[#1A1A1A]"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.title ? <p className="mt-3">{message.title}</p> : null}
                  {message.image ? (
                    <img
                      src={getImageUrl(message.image)}
                      alt={message.title || ""}
                      className="mt-3 aspect-[5/4] w-full bg-[#E7E1D8] object-cover object-center"
                    />
                  ) : null}
                  {message.description ? <p className="mt-3">{message.description}</p> : null}
                  {message.price ? <p className="mt-3">Стоимость: {message.price}</p> : null}
                  {message.production_time ? <p>Сроки: {message.production_time}</p> : null}
                </div>
              ))}
            </div>
            <form onSubmit={send} className="border-t border-[#E7E1D8] px-6 py-4">
              {draft && thread?.id === draft.dialogId ? (
                <div className="border border-[#E7E1D8] p-3">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    aria-label="Сообщение"
                    rows={8}
                    className="w-full resize-none bg-transparent text-sm font-light leading-7 outline-none"
                  />
                  {draft.image ? (
                    <img
                      src={getImageUrl(draft.image)}
                      alt=""
                      className="mt-3 aspect-[5/4] max-h-48 w-full bg-[#E7E1D8] object-cover object-center"
                    />
                  ) : null}
                </div>
              ) : (
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Сообщение"
                  aria-label="Сообщение"
                  className="w-full border-b border-[#E7E1D8] bg-transparent py-2 text-sm font-light outline-none"
                />
              )}
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !thread?.id || !text.trim()}
                  className="shrink-0 bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] text-white disabled:opacity-40"
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
