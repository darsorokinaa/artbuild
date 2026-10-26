"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount, type SessionUser } from "./account-provider";

const fieldClass =
  "mt-1 w-full border-b border-[#1A1A1A]/20 bg-transparent pb-1.5 pt-0.5 text-[15px] font-light outline-none";

const stepTitle = {
  1: "Основные данные",
  2: "Портфолио",
  3: "Работы",
} as const;

type Step = 1 | 2 | 3;

type WorkDraft = {
  key: string;
  title: string;
  description: string;
  photos: [File | null, File | null, File | null];
};

function emptyWork(): WorkDraft {
  return { key: crypto.randomUUID(), title: "", description: "", photos: [null, null, null] };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">{label}</span>
      {children}
    </label>
  );
}

function Progress({ step, onStep }: { step: Step; onStep: (step: Step) => void }) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-[11px] font-light tracking-[0.22em]">{step} / 3</p>
      <div className="flex flex-1 gap-1.5">
        {([1, 2, 3] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-label={stepTitle[item]}
            disabled={item > step}
            onClick={() => onStep(item)}
            className="flex h-3 flex-1 items-center disabled:cursor-default"
          >
            <span className={`h-px w-full ${item <= step ? "bg-[#1A1A1A]" : "bg-[#1A1A1A]/15"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function PhotoSlot({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label className="relative flex h-28 cursor-pointer items-center justify-center border border-[#1A1A1A]/25">
      {preview ? (
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/40">Фото</span>
      )}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

export function MasterRegister({ specialty, onSpecialty }: { specialty: string; onSpecialty: (value: string) => void }) {
  const router = useRouter();
  const { setSession } = useAccount();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [description, setDescription] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [works, setWorks] = useState<WorkDraft[]>([emptyWork()]);

  function continueFromDetails() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Укажите имя и фамилию.");
      return;
    }
    if (!email.includes("@")) {
      setError("Укажите почту.");
      return;
    }
    if (phone.trim().length < 6) {
      setError("Укажите телефон.");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов.");
      return;
    }
    if (password !== repeat) {
      setError("Пароли не совпадают.");
      return;
    }
    if (!description.trim()) {
      setError("Напишите краткое резюме.");
      return;
    }
    setError("");
    setStep(2);
  }

  function continueFromPortfolio() {
    if (!portfolioFile) {
      setError("Добавьте основное фото портфолио.");
      return;
    }
    if (!portfolioDescription.trim()) {
      setError("Опишите портфолио.");
      return;
    }
    setError("");
    setStep(3);
  }

  function updateWork(key: string, patch: Partial<WorkDraft>) {
    setWorks((current) => current.map((work) => (work.key === key ? { ...work, ...patch } : work)));
  }

  function setPhoto(key: string, slot: 0 | 1 | 2, file: File | null) {
    setWorks((current) =>
      current.map((work) => {
        if (work.key !== key) {
          return work;
        }
        const photos = [...work.photos] as WorkDraft["photos"];
        photos[slot] = file;
        return { ...work, photos };
      }),
    );
  }

  async function submit() {
    for (const work of works) {
      if (!work.title.trim() || !work.description.trim()) {
        setError("Укажите название и описание работы.");
        return;
      }
      if (work.photos.some((photo) => !photo)) {
        setError("У каждой работы должно быть три фотографии.");
        return;
      }
    }
    setPending(true);
    setError("");
    const body = new FormData();
    body.set("kind", "master");
    body.set("first_name", firstName.trim());
    body.set("last_name", lastName.trim());
    body.set("email", email.trim());
    body.set("phone", phone.trim());
    body.set("password", password);
    body.set("specialty", specialty);
    body.set("description", description.trim());
    body.set("portfolio_description", portfolioDescription.trim());
    if (portfolioFile) {
      body.append("portfolio", portfolioFile);
    }
    body.set(
      "works",
      JSON.stringify(works.map((work) => ({ title: work.title.trim(), description: work.description.trim() }))),
    );
    works.forEach((work, index) => {
      work.photos.forEach((photo, slot) => {
        if (photo) {
          body.append(`work_${index}_${slot}`, photo);
        }
      });
    });
    try {
      const response = await fetch("/api/register", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Не удалось зарегистрироваться.");
        return;
      }
      setSession(data.token, data.user as SessionUser);
      router.push("/account");
    } catch {
      setError("Регистрация временно недоступна.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      <p className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">{stepTitle[step]}</p>
      <div className="mt-3">
        <Progress
          step={step}
          onStep={(next) => {
            setError("");
            setStep(next);
          }}
        />
      </div>
      {step === 1 ? (
        <div className="mt-6 grid gap-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 min-[420px]:grid-cols-2">
            <Field label="Имя">
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={fieldClass} />
            </Field>
            <Field label="Фамилия">
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} className={fieldClass} />
            </Field>
            <Field label="Почта">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Телефон">
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} />
            </Field>
            <Field label="Пароль">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Пароль ещё раз">
              <input
                type="password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>
          <Field label="Специальность">
            <select value={specialty} onChange={(event) => onSpecialty(event.target.value)} className={fieldClass}>
              <option value="master">Мастер</option>
              <option value="designer">Дизайнер</option>
              <option value="architect">Архитектор</option>
            </select>
          </Field>
          <Field label="Краткое резюме">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className={`${fieldClass} min-h-16 resize-none`}
            />
          </Field>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="mt-6">
          <p className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">Основное фото</p>
          <div className="mt-3 w-28">
            <PhotoSlot file={portfolioFile} onChange={setPortfolioFile} />
          </div>
          <div className="mt-6">
            <Field label="Краткое описание">
              <textarea
                value={portfolioDescription}
                onChange={(event) => setPortfolioDescription(event.target.value)}
                rows={3}
                className={`${fieldClass} min-h-20 resize-none`}
              />
            </Field>
          </div>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="mt-6">
          <div className="grid gap-8">
            {works.map((work, index) => (
              <section key={work.key}>
                <div className="flex items-baseline justify-between">
                  <p className="text-[10px] font-light uppercase tracking-[0.2em] text-[#1A1A1A]/50">
                    Работа {String(index + 1).padStart(2, "0")}
                  </p>
                  {works.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setWorks((current) => current.filter((item) => item.key !== work.key))}
                      className="text-[10px] font-light uppercase tracking-[0.16em] text-[#1A1A1A]/45"
                    >
                      Удалить
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {([0, 1, 2] as const).map((slot) => (
                    <PhotoSlot
                      key={slot}
                      file={work.photos[slot]}
                      onChange={(file) => setPhoto(work.key, slot, file)}
                    />
                  ))}
                </div>
                <div className="mt-5 grid gap-4">
                  <Field label="Название">
                    <input
                      value={work.title}
                      onChange={(event) => updateWork(work.key, { title: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Краткое описание">
                    <textarea
                      value={work.description}
                      onChange={(event) => updateWork(work.key, { description: event.target.value })}
                      rows={2}
                      className={`${fieldClass} min-h-16 resize-none`}
                    />
                  </Field>
                </div>
              </section>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setWorks((current) => [...current, emptyWork()])}
            className="mt-6 border-b border-[#1A1A1A] pb-1 text-[11px] font-light uppercase tracking-[0.22em]"
          >
            + Добавить работу
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-5 text-sm font-light leading-7">{error}</p> : null}
      <div className={`mt-6 flex items-center max-[720px]:pr-16 ${step === 1 ? "justify-end" : "justify-between"}`}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep((current) => (current === 3 ? 2 : 1));
            }}
            className="border border-[#1A1A1A] bg-white px-6 py-2 text-[11px] font-light uppercase tracking-[0.28em]"
          >
            Назад
          </button>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            onClick={step === 1 ? continueFromDetails : continueFromPortfolio}
            className="bg-[#1A1A1A] px-6 py-2 text-[11px] font-light uppercase tracking-[0.28em] text-white"
          >
            Далее
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="bg-[#1A1A1A] px-6 py-2 text-[11px] font-light uppercase tracking-[0.28em] text-white disabled:opacity-40"
          >
            Создать учётную запись
          </button>
        )}
      </div>
    </div>
  );
}
