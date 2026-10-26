"use client";

import { useEffect, useState } from "react";
import { SiteShell } from "../site-shell";
import { useAccount } from "../account-provider";

type DialogItem = {
  id: number;
  with_name: string;
  last_text: string;
};

export default function RequestsPage() {
  return (
    <SiteShell>
      <RequestsBody />
    </SiteShell>
  );
}

function RequestsBody() {
  const { token, ready } = useAccount();
  const [dialogs, setDialogs] = useState<DialogItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!token) {
      setDialogs(null);
      setError("Войдите, чтобы видеть заявки.");
      return;
    }
    setError("");
    fetch("/api/account", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("no");
        }
        return response.json();
      })
      .then((data: { dialogs: DialogItem[] }) => setDialogs(data.dialogs))
      .catch(() => setError("Заявки временно недоступны."));
  }, [ready, token]);

  return (
    <section className="px-6 py-12 md:px-12 md:py-16 lg:px-16">
      <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/55">Переписка</p>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-6xl font-light leading-none md:text-7xl">Заявки</h1>
      {error ? <p className="mt-8 text-sm font-light leading-7">{error}</p> : null}
      {dialogs && dialogs.length === 0 ? <p className="mt-8 text-sm font-light leading-7">Заявок пока нет.</p> : null}
      {dialogs && dialogs.length > 0 ? (
        <ul className="mt-10 max-w-xl">
          {dialogs.map((dialog) => (
            <li key={dialog.id} className="border-t border-[#E7E1D8] py-4 text-sm font-light">
              {dialog.with_name}
              {dialog.last_text ? <span className="mt-1 block text-[#1A1A1A]/55">{dialog.last_text}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
