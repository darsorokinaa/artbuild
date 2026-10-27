"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount, type SessionUser } from "./account-provider";

const fieldClass =
  "mt-2 w-full min-h-11 border-b bg-transparent pb-2 text-base text-[#242321] outline-none focus:border-[#242321] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#F5F3EF] [&:-webkit-autofill]:[-webkit-text-fill-color:#242321]";

const specialties = [
  ["master", "Мастер"],
  ["designer", "Дизайнер"],
  ["architect", "Архитектор"],
] as const;

const steps = [
  [1, "Основные данные"],
  [2, "Профиль"],
  [3, "Завершение"],
] as const;

type Step = 1 | 2 | 3;
type Kind = "master" | "customer";

type WorkDraft = {
  key: string;
  title: string;
  description: string;
  photos: [File | null, File | null, File | null];
};

type FieldName = "firstName" | "lastName" | "email" | "phone" | "password" | "repeat" | "description";

function emptyWork(): WorkDraft {
  return { key: crypto.randomUUID(), title: "", description: "", photos: [null, null, null] };
}

function inputClass(invalid: boolean) {
  return `${fieldClass} ${invalid ? "border-[#6E3B34]" : "border-[#DAD5CE]"}`;
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[13px] text-[#77736E]">{label}</span>
      {hint ? <span className="mt-1 block text-[13px] leading-5 text-[#77736E]">{hint}</span> : null}
      {children}
      {error ? <span className="mt-1.5 block text-[13px] leading-5 text-[#6E3B34]">{error}</span> : null}
    </label>
  );
}

function Progress({ step, onStep }: { step: Step; onStep: (step: Step) => void }) {
  return (
    <ol className="grid grid-cols-3 gap-3">
      {steps.map(([item, label]) => {
        const active = item === step;
        const reached = item <= step;
        return (
          <li key={item}>
            <button
              type="button"
              onClick={() => onStep(item)}
              aria-current={active ? "step" : undefined}
              className="w-full text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
            >
              <span className={`block h-px ${reached ? "bg-[#242321]" : "bg-[#DAD5CE]"}`} />
              <span className={`mt-2 block text-[11px] tracking-[0.14em] ${active ? "text-[#242321]" : "text-[#77736E]"}`}>
                {String(item).padStart(2, "0")}
              </span>
              <span className={`mt-1 block text-[13px] leading-5 ${active ? "text-[#242321]" : "text-[#77736E]"}`}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
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
    <label className="relative flex h-28 cursor-pointer items-center justify-center border border-[#DAD5CE] bg-white">
      {preview ? (
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="px-2 text-center text-[13px] text-[#77736E]">Фото</span>
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

function PasswordField({
  label,
  value,
  autoComplete,
  invalid,
  error,
  onChange,
}: {
  label: string;
  value: string;
  autoComplete: string;
  invalid: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="min-w-0">
      <span className="text-[13px] text-[#77736E]">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          aria-label={label}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass(invalid)} pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute bottom-2 right-0 text-[13px] text-[#77736E] hover:text-[#242321] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
        >
          {visible ? "Скрыть" : "Показать"}
        </button>
      </div>
      {error ? <span className="mt-1.5 block text-[13px] leading-5 text-[#6E3B34]">{error}</span> : null}
    </div>
  );
}

export function MasterRegister({ initialKind = "customer" }: { initialKind?: Kind }) {
  const router = useRouter();
  const { setSession } = useAccount();
  const sending = useRef(false);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [step, setStep] = useState<Step>(1);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pending, setPending] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [specialty, setSpecialty] = useState<(typeof specialties)[number][0]>("master");
  const [description, setDescription] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [works, setWorks] = useState<WorkDraft[]>([emptyWork()]);

  function clearField(name: FieldName) {
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validateDetails() {
    const next: Partial<Record<FieldName, string>> = {};
    if (!firstName.trim()) {
      next.firstName = "Укажите имя.";
    }
    if (!lastName.trim()) {
      next.lastName = "Укажите фамилию.";
    }
    const mail = email.trim();
    if (mail.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      next.email = "Укажите почту.";
    }
    if (phone.trim().length < 6) {
      next.phone = "Укажите телефон.";
    }
    if (password.length < 8) {
      next.password = "Пароль должен быть не короче 8 символов.";
    }
    if (password !== repeat) {
      next.repeat = "Пароли не совпадают.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateProfile() {
    if (kind !== "master") {
      return true;
    }
    if (!description.trim()) {
      setFieldErrors({ description: "Напишите краткое резюме." });
      return false;
    }
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.description;
      return next;
    });
    return true;
  }

  function goTo(next: Step) {
    if (next === step) {
      return;
    }
    if (next < step) {
      setFormError("");
      setStep(next);
      return;
    }
    if (!validateDetails()) {
      setStep(1);
      return;
    }
    if (next > 2 && !validateProfile()) {
      setStep(2);
      return;
    }
    setFormError("");
    setStep(next);
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

  function worksProblem() {
    if (!portfolioFile) {
      return "Добавьте основное фото портфолио.";
    }
    if (!portfolioDescription.trim()) {
      return "Опишите портфолио.";
    }
    for (const work of works) {
      if (!work.title.trim() || !work.description.trim()) {
        return "Укажите название и описание работы.";
      }
      if (work.photos.some((photo) => !photo)) {
        return "У каждой работы должно быть три фотографии.";
      }
    }
    return "";
  }

  async function submit() {
    if (sending.current) {
      return;
    }
    if (!validateDetails()) {
      setStep(1);
      return;
    }
    if (!validateProfile()) {
      setStep(2);
      return;
    }
    if (kind === "master") {
      const problem = worksProblem();
      if (problem) {
        setFormError(problem);
        return;
      }
    }
    sending.current = true;
    setPending(true);
    setFormError("");
    try {
      const response =
        kind === "master" ? await fetch("/api/register", { method: "POST", body: masterBody() }) : await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "customer",
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            specialty: "",
            description: "",
          }),
        });
      const data = await response.json();
      if (!response.ok) {
        const detail = data.detail || "Не удалось зарегистрироваться.";
        if (detail.includes("почт")) {
          setFieldErrors({ email: detail });
          setStep(1);
        } else if (detail.includes("телефон")) {
          setFieldErrors({ phone: detail });
          setStep(1);
        } else if (detail.includes("Пароль")) {
          setFieldErrors({ password: detail });
          setStep(1);
        } else if (detail.includes("резюме") || detail.includes("специальность")) {
          setFieldErrors({ description: detail });
          setStep(2);
        } else {
          setFormError(detail);
        }
        sending.current = false;
        setPending(false);
        return;
      }
      setSession(data.token, data.user as SessionUser);
      router.push("/account");
    } catch {
      setFormError("Регистрация временно недоступна.");
      sending.current = false;
      setPending(false);
    }
  }

  function masterBody() {
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
    return body;
  }

  return (
    <div className="mx-auto w-full max-w-[560px] pb-24">
      <p className="text-[11px] tracking-[0.28em] text-[#77736E]">
        <span className="lowercase">blurrr</span>
        <span className="uppercase"> / Создание профиля</span>
      </p>
      <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] text-[#242321] sm:text-5xl">
        Присоединиться к blurrr
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#77736E]">
        Создайте профиль, представьте свои работы и находите новые проекты.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {(
          [
            ["master", "Я мастер"],
            ["customer", "Я заказчик"],
          ] as const
        ).map(([value, label]) => {
          const active = kind === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={`min-h-11 px-3 text-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321] ${
                active ? "bg-[#242321] text-white" : "border border-[#DAD5CE] bg-white text-[#242321] hover:border-[#242321]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-sm text-[#77736E]">
        Уже есть аккаунт?{" "}
        <a
          href="/login"
          className="text-[#242321] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
        >
          Войти
        </a>
      </p>
      <div className="mt-10">
        <Progress step={step} onStep={goTo} />
      </div>

      {step === 1 ? (
        <form
          noValidate
          className="mt-10"
          onSubmit={(event) => {
            event.preventDefault();
            if (validateDetails()) {
              setFormError("");
              setStep(2);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <Field label="Имя" error={fieldErrors.firstName}>
              <input
                name="first_name"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  clearField("firstName");
                }}
                className={inputClass(Boolean(fieldErrors.firstName))}
              />
            </Field>
            <Field label="Фамилия" error={fieldErrors.lastName}>
              <input
                name="last_name"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearField("lastName");
                }}
                className={inputClass(Boolean(fieldErrors.lastName))}
              />
            </Field>
            <Field label="Электронная почта" error={fieldErrors.email}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearField("email");
                }}
                className={inputClass(Boolean(fieldErrors.email))}
              />
            </Field>
            <Field label="Телефон" error={fieldErrors.phone}>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  clearField("phone");
                }}
                className={inputClass(Boolean(fieldErrors.phone))}
              />
            </Field>
            <PasswordField
              label="Пароль"
              value={password}
              autoComplete="new-password"
              invalid={Boolean(fieldErrors.password)}
              error={fieldErrors.password}
              onChange={(value) => {
                setPassword(value);
                clearField("password");
              }}
            />
            <PasswordField
              label="Повтор пароля"
              value={repeat}
              autoComplete="new-password"
              invalid={Boolean(fieldErrors.repeat)}
              error={fieldErrors.repeat}
              onChange={(value) => {
                setRepeat(value);
                clearField("repeat");
              }}
            />
          </div>
          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center bg-[#242321] px-5 text-sm text-white hover:bg-[#3a3835] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
            >
              Продолжить →
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          noValidate
          className="mt-10"
          onSubmit={(event) => {
            event.preventDefault();
            if (validateProfile()) {
              setFormError("");
              setStep(3);
            }
          }}
        >
          {kind === "master" ? (
            <div className="grid gap-6">
              <Field label="Специализация">
                <select
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value as (typeof specialties)[number][0])}
                  className={inputClass(false)}
                >
                  {specialties.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="О себе и своей работе"
                hint="Расскажите, чем вы занимаетесь, какие материалы используете и какие проекты создаёте."
                error={fieldErrors.description}
              >
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    clearField("description");
                  }}
                  rows={4}
                  className={`${inputClass(Boolean(fieldErrors.description))} min-h-28 resize-y`}
                />
              </Field>
            </div>
          ) : (
            <p className="max-w-md text-sm leading-6 text-[#77736E]">
              Для заказчика профессиональный профиль не нужен. Дальше можно проверить данные и создать аккаунт.
            </p>
          )}
          <StepNav onBack={() => goTo(1)} label="Продолжить →" />
        </form>
      ) : null}

      {step === 3 ? (
        <div className="mt-10">
          {kind === "master" ? (
            <div>
              <p className="max-w-md text-sm leading-6 text-[#77736E]">
                Основное фото и первая работа сохраняются вместе с аккаунтом.
              </p>
              <p className="mt-8 text-[13px] text-[#77736E]">Основное фото</p>
              <div className="mt-3 w-28">
                <PhotoSlot file={portfolioFile} onChange={setPortfolioFile} />
              </div>
              <div className="mt-6">
                <Field label="Описание портфолио">
                  <textarea
                    value={portfolioDescription}
                    onChange={(event) => setPortfolioDescription(event.target.value)}
                    rows={3}
                    className={`${inputClass(false)} min-h-24 resize-y`}
                  />
                </Field>
              </div>
              <div className="mt-10 grid gap-10">
                {works.map((work, index) => (
                  <section key={work.key}>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-[13px] text-[#77736E]">Работа {String(index + 1).padStart(2, "0")}</p>
                      {works.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setWorks((current) => current.filter((item) => item.key !== work.key))}
                          className="text-[13px] text-[#77736E] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
                        >
                          Удалить
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {([0, 1, 2] as const).map((slot) => (
                        <PhotoSlot key={slot} file={work.photos[slot]} onChange={(file) => setPhoto(work.key, slot, file)} />
                      ))}
                    </div>
                    <div className="mt-5 grid gap-6">
                      <Field label="Название">
                        <input
                          value={work.title}
                          onChange={(event) => updateWork(work.key, { title: event.target.value })}
                          className={inputClass(false)}
                        />
                      </Field>
                      <Field label="Описание">
                        <textarea
                          value={work.description}
                          onChange={(event) => updateWork(work.key, { description: event.target.value })}
                          rows={2}
                          className={`${inputClass(false)} min-h-20 resize-y`}
                        />
                      </Field>
                    </div>
                  </section>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setWorks((current) => [...current, emptyWork()])}
                className="mt-8 text-sm text-[#242321] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
              >
                Добавить работу
              </button>
            </div>
          ) : (
            <dl className="grid gap-5 text-sm">
              <div>
                <dt className="text-[13px] text-[#77736E]">Имя</dt>
                <dd className="mt-1 text-[#242321]">
                  {firstName} {lastName}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#77736E]">Электронная почта</dt>
                <dd className="mt-1 break-all text-[#242321]">{email}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#77736E]">Телефон</dt>
                <dd className="mt-1 text-[#242321]">{phone}</dd>
              </div>
            </dl>
          )}
          {formError ? <p className="mt-6 text-sm leading-6 text-[#6E3B34]">{formError}</p> : null}
          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goTo(2)}
              className="inline-flex min-h-11 items-center border border-[#DAD5CE] bg-white px-5 text-sm text-[#242321] hover:border-[#242321] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="inline-flex min-h-11 items-center bg-[#242321] px-5 text-sm text-white hover:bg-[#3a3835] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321] disabled:opacity-40"
            >
              {pending ? "Создаём аккаунт…" : "Создать аккаунт"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepNav({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center border border-[#DAD5CE] bg-white px-5 text-sm text-[#242321] hover:border-[#242321] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
      >
        Назад
      </button>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center bg-[#242321] px-5 text-sm text-white hover:bg-[#3a3835] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
      >
        {label}
      </button>
    </div>
  );
}
