"use client";

import { useEffect, useState } from "react";
import { SiteShell } from "../site-shell";
import { useAccount } from "../account-provider";
import { getImageUrl } from "../media-url";
import { ProductForm } from "../product-form";

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

type CabinetNotice = {
  id: number;
  text: string;
  href: string;
  read: boolean;
};

type CabinetReply = {
  id: number;
  task_id: number;
  task_title: string;
  price: string;
  deadline: string;
  status_label: string;
};

type CabinetTask = {
  id: number;
  title: string;
  status_label: string;
  budget_label: string;
  deadline: string;
  responses_count: number;
  assignee_name?: string;
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
  responses?: CabinetReply[];
  tasks?: CabinetTask[];
  notices?: CabinetNotice[];
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

const actionClass =
  "inline-flex border border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] text-white";

const quietClass =
  "inline-flex border border-[#1A1A1A] bg-white px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em]";

function MasterCabinet({
  portfolios,
  products,
  responses,
  dialogs,
  onProductCreated,
}: {
  portfolios: CabinetWork[];
  products: CabinetProduct[];
  responses: CabinetReply[];
  dialogs: { id: number; with_name: string; last_text: string }[];
  onProductCreated: () => void;
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
          <article key={work.id} className="mt-4 border-t border-[#E6E6E6] pt-4">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-light">{work.title}</h3>
            <Photos images={work.images} />
            {work.description ? <p className="mt-4 max-w-xl text-sm font-light leading-7">{work.description}</p> : null}
            <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{work.status}</p>
          </article>
        ))}
        {works.length > 0 ? (
          <ul className="mt-8">
            {works.map((work) => (
              <li key={work.id} className="border-t border-[#E6E6E6] py-5">
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className={heading}>{products.length === 0 ? "Добавьте своё первое изделие" : "Изделия"}</h2>
          {products.length === 0 ? null : (
            <a href="/products/new" className={actionClass}>
              Выложить товар
            </a>
          )}
        </div>
        {products.length === 0 ? (
          <div className="mt-8">
            <ProductForm embedded onCreated={onProductCreated} />
          </div>
        ) : (
        <ul className="mt-4">
          {products.map((product) => {
            const price = priceFor(product.price);
            return (
              <li key={product.id} className="border-t border-[#E6E6E6] py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-light">{product.title}</h3>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{product.status}</span>
                </div>
                {product.image ? (
                  <img src={getImageUrl(product.image)} alt="" className="mt-4 h-28 w-24 border border-[#E6E6E6] object-cover" />
                ) : null}
                <p className="mt-3 text-sm font-light leading-7 text-[#1A1A1A]/70">
                  {[product.sphere, price, product.production_time].filter(Boolean).join(" · ")}
                </p>
                {product.description ? <p className="mt-2 max-w-xl text-sm font-light leading-7">{product.description}</p> : null}
              </li>
            );
          })}
        </ul>
        )}
      </section>
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className={heading}>Отклики</h2>
          <a href="/tasks" className={quietClass}>
            Лента задач
          </a>
        </div>
        {responses.length === 0 ? <p className="mt-4 text-sm font-light leading-7">Активных откликов пока нет.</p> : null}
        <ul className="mt-4 max-w-xl">
          {responses.map((reply) => (
            <li key={reply.id} className="border-t border-[#E6E6E6] py-4 text-sm font-light">
              <a href={`/tasks/${reply.task_id}`} className="font-[family-name:var(--font-display)] text-2xl font-light">
                {reply.task_title}
              </a>
              <span className="mt-2 block text-[#1A1A1A]/70">
                {[priceFor(reply.price), reply.deadline, reply.status_label].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className={heading}>Диалоги</h2>
        {dialogs.length === 0 ? <p className="mt-4 text-sm font-light leading-7">Переписок пока нет.</p> : null}
        <ul className="mt-4 max-w-xl">
          {dialogs.map((dialog) => (
            <li key={dialog.id} className="border-t border-[#E6E6E6] py-3 text-sm font-light">
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
    <ul className="mt-4 flex flex-wrap gap-3">
      {images.map((photo, index) => (
        <li key={photo.src} className="w-28">
          <div className="h-28 w-24 border border-[#E6E6E6]">
            <img src={getImageUrl(photo.src)} alt={photo.description || ""} className="h-full w-full object-cover" />
          </div>
          {index === 0 ? <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#1A1A1A]/45">Основное</p> : null}
          {photo.description ? <p className="mt-1 text-[13px] leading-5 text-[#1A1A1A]/70">{photo.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function Notices({ notices }: { notices: CabinetNotice[] }) {
  if (notices.length === 0) {
    return null;
  }
  return (
    <section className="mt-12 max-w-xl">
      <h2 className="font-[family-name:var(--font-display)] text-4xl font-light">Уведомления</h2>
      <ul className="mt-4">
        {notices.map((notice) => (
          <li key={notice.id} className="border-t border-[#E6E6E6] py-3 text-sm font-light">
            {notice.href ? (
              <a href={notice.href} className={notice.read ? "text-[#1A1A1A]/55" : "text-[#1A1A1A]"}>
                {notice.text}
              </a>
            ) : (
              <span className={notice.read ? "text-[#1A1A1A]/55" : ""}>{notice.text}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CustomerCabinet({
  tasks,
  dialogs,
}: {
  tasks: CabinetTask[];
  dialogs: { id: number; with_name: string; last_text: string }[];
}) {
  return (
    <div className="mt-12 max-w-xl">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-light">Задачи</h2>
          <a href="/tasks/new" className={actionClass}>
            Создать задачу
          </a>
        </div>
        {tasks.length === 0 ? <p className="mt-4 text-sm font-light leading-7">Задач пока нет.</p> : null}
        <ul className="mt-4">
          {tasks.map((task) => (
            <li key={task.id} className="border-t border-[#E6E6E6] py-4 text-sm font-light">
              <div className="flex items-baseline justify-between gap-4">
                <a href={`/tasks/${task.id}`} className="font-[family-name:var(--font-display)] text-2xl font-light">
                  {task.title}
                </a>
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45">{task.status_label}</span>
              </div>
              <span className="mt-2 block text-[#1A1A1A]/70">
                {[
                  task.budget_label,
                  task.deadline,
                  task.assignee_name ? `исполнитель ${task.assignee_name}` : repliesLabel(task.responses_count),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-4xl font-light">Диалоги</h2>
        {dialogs.length === 0 ? <p className="mt-4 text-sm font-light leading-7">Переписок пока нет.</p> : null}
        <ul className="mt-4">
          {dialogs.map((dialog) => (
            <li key={dialog.id} className="border-t border-[#E6E6E6] py-3 text-sm font-light">
              {dialog.with_name}
              {dialog.last_text ? <span className="mt-1 block truncate text-[#1A1A1A]/55">{dialog.last_text}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
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
  const [revision, setRevision] = useState(0);

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
  }, [ready, token, revision]);

  const user = cabinet?.user;

  return (
    <section className="px-9 py-12 md:px-[25.2rem] md:py-16 lg:px-[33.6rem]">
      <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/55">Личный кабинет</p>
      {error ? <p className="mt-8 text-sm font-light leading-7">{error}</p> : null}
      {!user ? null : (
        <>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-6xl font-light leading-none md:text-7xl">
            {user.first_name} {user.last_name}
          </h1>
          <p className="mt-4 text-sm font-light leading-7 text-[#1A1A1A]/70">{user.role_label}</p>
          <dl className="mt-8 max-w-xl text-sm font-light leading-7">
            <div className="flex justify-between gap-6 border-t border-[#E6E6E6] py-3">
              <dt>Почта</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between gap-6 border-t border-[#E6E6E6] py-3">
              <dt>Телефон</dt>
              <dd>{user.phone}</dd>
            </div>
            {cabinet.kind === "master" ? (
              <div className="border-t border-[#E6E6E6] py-3">
                <dt>Резюме</dt>
                <dd className="mt-2 max-w-xl">{user.description || "Резюме пока не заполнено."}</dd>
              </div>
            ) : null}
          </dl>
          <Notices notices={cabinet.notices ?? []} />
          {cabinet.kind === "master" ? (
            <MasterCabinet
              portfolios={cabinet.portfolios ?? []}
              products={cabinet.products ?? []}
              responses={cabinet.responses ?? []}
              dialogs={cabinet.dialogs}
              onProductCreated={() => setRevision((current) => current + 1)}
            />
          ) : (
            <CustomerCabinet tasks={cabinet.tasks ?? []} dialogs={cabinet.dialogs} />
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
