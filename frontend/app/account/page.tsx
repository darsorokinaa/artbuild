"use client";

import { useEffect, useState } from "react";
import { SiteShell } from "../site-shell";
import { useAccount } from "../account-provider";
import { getImageUrl } from "../media-url";

type Photo = { src: string; description?: string };

type CabinetWork = {
  id: number;
  title: string;
  description: string;
  status: string;
  main: boolean;
  images: Photo[];
};

type CabinetProduct = {
  id: number;
  title: string;
  description: string;
  status: string;
  price: string;
  image?: string | null;
  sphere?: string;
  production_time?: string;
};

type Cabinet = {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    role_label: string;
    description: string;
  };
  kind: "master" | "customer";
  dialogs: { id: number; with_name: string; last_text: string }[];
  portfolios?: CabinetWork[];
  products?: CabinetProduct[];
};

function priceFor(price?: string) {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${digits} ₽`;
}

function MasterCabinet({
  portfolios,
  products,
  dialogs,
}: {
  portfolios: CabinetWork[];
  products: CabinetProduct[];
  dialogs: { id: number; with_name: string; last_text: string }[];
}) {
  const cover = portfolios.filter((work) => work.main);
  const works = portfolios.filter((work) => !work.main);
  const heading = "font-[family-name:var(--font-display)] text-4xl font-light";

  return (
    <div className="mt-12 max-w-3xl">
      <section>
        <h2 className={heading}>Портфолио</h2>
        {cover.length === 0 && works.length === 0 ? (
          <p className="mt-4 text-sm font-light leading-7">Портфолио пока не загружено.</p>
        ) : null}
        {cover.map((work) => (
          <article key={work.id} className="mt-4 border-t border-[#E7E1D8] pt-4">
            <Photos images={work.images.slice(0, 1)} />
            {work.description ? <p className="mt-4 max-w-xl text-sm font-light leading-7">{work.description}</p> : null}
            <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{work.status}</p>
          </article>
        ))}
        {works.length > 0 ? (
          <ul className="mt-8">
            {works.map((work) => (
              <li key={work.id} className="border-t border-[#E7E1D8] py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-light">{work.title}</h3>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{work.status}</span>
                </div>
                <Photos images={work.images} />
                {work.description ? <p className="mt-4 max-w-xl text-sm font-light leading-7">{work.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="mt-12">
        <h2 className={heading}>Изделия</h2>
        {products.length === 0 ? <p className="mt-4 text-sm font-light leading-7">Изделий пока нет.</p> : null}
        <ul className="mt-4">
          {products.map((product) => {
            const price = priceFor(product.price);
            return (
              <li key={product.id} className="border-t border-[#E7E1D8] py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-light">{product.title}</h3>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{product.status}</span>
                </div>
                {product.image ? (
                  <img src={getImageUrl(product.image)} alt="" className="mt-4 h-28 w-24 border border-[#E7E1D8] object-cover" />
                ) : null}
                <p className="mt-3 text-sm font-light leading-7 text-[#1A1A1A]/70">
                  {[product.sphere, price, product.production_time].filter(Boolean).join(" · ")}
                </p>
                {product.description ? <p className="mt-2 max-w-xl text-sm font-light leading-7">{product.description}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className={heading}>Диалоги</h2>
        {dialogs.length === 0 ? <p className="mt-4 text-sm font-light leading-7">Переписок пока нет.</p> : null}
        <ul className="mt-4 max-w-xl">
          {dialogs.map((dialog) => (
            <li key={dialog.id} className="border-t border-[#E7E1D8] py-3 text-sm font-light">
              {dialog.with_name}
              {dialog.last_text ? <span className="mt-1 block truncate text-[#1A1A1A]/55">{dialog.last_text}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Photos({ images }: { images: Photo[] }) {
  if (!images.length) {
    return null;
  }
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {images.map((photo) => (
        <li key={photo.src} className="h-28 w-24 border border-[#E7E1D8]">
          <img src={getImageUrl(photo.src)} alt="" className="h-full w-full object-cover" />
        </li>
      ))}
    </ul>
  );
}

export default function AccountPage() {
  return (
    <SiteShell>
      <CabinetBody />
    </SiteShell>
  );
}

function CabinetBody() {
  const { token, ready, logout } = useAccount();
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!token) {
      setCabinet(null);
      setError("Войдите, чтобы открыть кабинет.");
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
      .then((data: Cabinet) => setCabinet(data))
      .catch(() => setError("Кабинет временно недоступен."));
  }, [ready, token]);

  const user = cabinet?.user;

  return (
    <section className="px-6 py-12 md:px-12 md:py-16 lg:px-16">
      <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/55">Личный кабинет</p>
      {error ? <p className="mt-8 text-sm font-light leading-7">{error}</p> : null}
      {!user ? null : (
        <>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-6xl font-light leading-none md:text-7xl">
            {user.first_name} {user.last_name}
          </h1>
          <p className="mt-4 text-sm font-light leading-7 text-[#1A1A1A]/70">{user.role_label}</p>
          <dl className="mt-8 max-w-xl text-sm font-light leading-7">
            <div className="flex justify-between gap-6 border-t border-[#E7E1D8] py-3">
              <dt>Почта</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between gap-6 border-t border-[#E7E1D8] py-3">
              <dt>Телефон</dt>
              <dd>{user.phone}</dd>
            </div>
            {cabinet.kind === "master" ? (
              <div className="border-t border-[#E7E1D8] py-3">
                <dt>Резюме</dt>
                <dd className="mt-2 max-w-xl">{user.description || "Резюме пока не заполнено."}</dd>
              </div>
            ) : null}
          </dl>
          {cabinet.kind === "master" ? (
            <MasterCabinet portfolios={cabinet.portfolios ?? []} products={cabinet.products ?? []} dialogs={cabinet.dialogs} />
          ) : (
            <section className="mt-12 max-w-xl">
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-light">Диалоги</h2>
              {cabinet.dialogs.length === 0 ? (
                <p className="mt-4 text-sm font-light leading-7">Переписок пока нет.</p>
              ) : (
                <ul className="mt-4">
                  {cabinet.dialogs.map((dialog) => (
                    <li key={dialog.id} className="border-t border-[#E7E1D8] py-3 text-sm font-light">
                      {dialog.with_name}
                      {dialog.last_text ? (
                        <span className="mt-1 block truncate text-[#1A1A1A]/55">{dialog.last_text}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <button
            type="button"
            onClick={logout}
            className="mt-12 border border-[#1A1A1A] bg-white px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em]"
          >
            Выйти
          </button>
        </>
      )}
    </section>
  );
}
