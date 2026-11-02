"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount, type SessionUser } from "./account-provider";

const fieldClass =
  "mt-2 w-full min-h-11 border-b bg-transparent pb-2 text-base text-[#242424] outline-none focus:border-[#242424] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#F4F4F4] [&:-webkit-autofill]:[-webkit-text-fill-color:#242424]";

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

type PhotoDraft = {
  key: string;
  file: File | null;
  description: string;
};

type PortfolioDraft = {
  key: string;
  title: string;
  description: string;
  photos: PhotoDraft[];
};

type FieldName = "firstName" | "lastName" | "email" | "phone" | "password" | "repeat" | "description";

let draftCount = 0;

function nextDraftKey(prefix: string) {
  draftCount += 1;
  return `${prefix}-${draftCount}`;
}

function emptyPhoto(): PhotoDraft {
  return { key: nextDraftKey("photo"), file: null, description: "" };
}

function emptyPortfolio(): PortfolioDraft {
  return { key: nextDraftKey("portfolio"), title: "", description: "", photos: [emptyPhoto()] };
}

function inputClass(invalid: boolean) {
  return `${fieldClass} ${invalid ? "border-[#333333]" : "border-[#D9D9D9]"}`;
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
      <span className="text-[13px] text-[#767676]">{label}</span>
      {hint ? <span className="mt-1 block text-[13px] leading-5 text-[#767676]">{hint}</span> : null}
      {children}
      {error ? <span className="mt-1.5 block text-[13px] leading-5 text-[#333333]">{error}</span> : null}
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
              className="w-full text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
            >
              <span className={`block h-px ${reached ? "bg-[#242424]" : "bg-[#D9D9D9]"}`} />
              <span className={`mt-2 block text-[11px] tracking-[0.14em] ${active ? "text-[#242424]" : "text-[#767676]"}`}>
                {String(item).padStart(2, "0")}
              </span>
              <span className={`mt-1 block text-[13px] leading-5 ${active ? "text-[#242424]" : "text-[#767676]"}`}>{label}</span>
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
    <label className="relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center border border-[#D9D9D9] bg-white">
      {preview ? (
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="px-2 text-center text-[13px] text-[#767676]">Выбрать фото</span>
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
      <span className="text-[13px] text-[#767676]">{label}</span>
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
          className="absolute bottom-2 right-0 text-[13px] text-[#767676] hover:text-[#242424] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
        >
          {visible ? "Скрыть" : "Показать"}
        </button>
      </div>
      {error ? <span className="mt-1.5 block text-[13px] leading-5 text-[#333333]">{error}</span> : null}
    </div>
  );
}

export function MasterRegister({
  initialKind = "customer",
  initialSpecialty = "master",
}: {
  initialKind?: Kind;
  initialSpecialty?: (typeof specialties)[number][0];
}) {
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
  const [specialty, setSpecialty] = useState<(typeof specialties)[number][0]>(initialSpecialty);
  const [description, setDescription] = useState("");
  const [portfolios, setPortfolios] = useState<PortfolioDraft[]>([]);

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

  function updatePortfolio(key: string, patch: Partial<PortfolioDraft>) {
    setPortfolios((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function updatePhoto(portfolioKey: string, photoKey: string, patch: Partial<PhotoDraft>) {
    setPortfolios((current) =>
      current.map((item) => {
        if (item.key !== portfolioKey) {
          return item;
        }
        return {
          ...item,
          photos: item.photos.map((photo) => (photo.key === photoKey ? { ...photo, ...patch } : photo)),
        };
      }),
    );
  }

  function movePhoto(portfolioKey: string, photoKey: string, direction: -1 | 1) {
    setPortfolios((current) =>
      current.map((item) => {
        if (item.key !== portfolioKey) {
          return item;
        }
        const index = item.photos.findIndex((photo) => photo.key === photoKey);
        const next = index + direction;
        if (index < 0 || next < 0 || next >= item.photos.length) {
          return item;
        }
        const photos = [...item.photos];
        const [photo] = photos.splice(index, 1);
        photos.splice(next, 0, photo);
        return { ...item, photos };
      }),
    );
  }

  function portfoliosProblem() {
    if (portfolios.length === 0) {
      return "Добавьте портфолио.";
    }
    for (const portfolio of portfolios) {
      if (!portfolio.title.trim() || !portfolio.description.trim()) {
        return "Укажите название и описание работы.";
      }
      if (portfolio.photos.length === 0 || portfolio.photos.some((photo) => !photo.file)) {
        return "Добавьте фотографию портфолио.";
      }
      if (portfolio.photos.some((photo) => !photo.description.trim())) {
        return "Добавьте описание к каждой фотографии.";
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
      const problem = portfoliosProblem();
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
    body.set(
      "portfolios",
      JSON.stringify(
        portfolios.map((portfolio) => ({
          title: portfolio.title.trim(),
          description: portfolio.description.trim(),
          photos: portfolio.photos.map((photo) => ({ description: photo.description.trim() })),
        })),
      ),
    );
    portfolios.forEach((portfolio, index) => {
      portfolio.photos.forEach((photo, slot) => {
        if (photo.file) {
          body.append(`portfolio_${index}_${slot}`, photo.file);
        }
      });
    });
    return body;
  }

  const wide = step > 1;

  return (
    <div className={wide ? "" : "lg:grid lg:grid-cols-[minmax(0,650px)_minmax(0,1fr)]"}>
      <div className="px-5 py-10 sm:px-10 lg:px-14 lg:py-16">
    <div className={`mx-auto w-full pb-24 ${wide ? "max-w-3xl" : "max-w-[560px]"}`}>
      <p className="text-[11px] tracking-[0.28em] text-[#767676]">
        <span className="lowercase">naidista</span>
        <span className="uppercase"> / Создание профиля</span>
      </p>
      <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] text-[#242424] sm:text-5xl">
        Присоединиться к naidista
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#767676]">
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
              className={`min-h-11 px-3 text-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424] ${
                active ? "bg-[#242424] text-white" : "border border-[#D9D9D9] bg-white text-[#242424] hover:border-[#242424]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-sm text-[#767676]">
        Уже есть аккаунт?{" "}
        <a
          href="/login"
          className="text-[#242424] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
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
              className="inline-flex min-h-11 items-center bg-[#242424] px-5 text-sm text-white hover:bg-[#3A3A3A] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
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
            <p className="max-w-md text-sm leading-6 text-[#767676]">
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
              <p className="max-w-md text-sm leading-6 text-[#767676]">
                Портфолио сохраняется вместе с аккаунтом. Первое фото становится основным.
              </p>
              <div className="mt-8 grid gap-10">
                {portfolios.map((portfolio, index) => (
                  <section key={portfolio.key} className="border-t border-[#D9D9D9] pt-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-[13px] text-[#767676]">Портфолио {String(index + 1).padStart(2, "0")}</p>
                      <button
                        type="button"
                        onClick={() => setPortfolios((current) => current.filter((item) => item.key !== portfolio.key))}
                        className="text-[13px] text-[#767676] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
                      >
                        Удалить
                      </button>
                    </div>
                    <div className="mt-5 grid gap-6">
                      <Field label="Название">
                        <input
                          value={portfolio.title}
                          onChange={(event) => updatePortfolio(portfolio.key, { title: event.target.value })}
                          className={inputClass(false)}
                        />
                      </Field>
                      <Field label="Описание работы">
                        <textarea
                          value={portfolio.description}
                          onChange={(event) => updatePortfolio(portfolio.key, { description: event.target.value })}
                          rows={3}
                          className={`${inputClass(false)} min-h-24 resize-y`}
                        />
                      </Field>
                    </div>
                    <div className="mt-6 grid gap-4">
                      {portfolio.photos.map((photo, photoIndex) => (
                        <div key={photo.key} className="grid gap-4 border border-[#D9D9D9] bg-white p-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                          <PhotoSlot
                            file={photo.file}
                            onChange={(file) => updatePhoto(portfolio.key, photo.key, { file })}
                          />
                          <div className="min-w-0">
                            {photoIndex === 0 ? <p className="text-[13px] text-[#242424]">Основное</p> : null}
                            <Field label="Описание картинки">
                              <input
                                value={photo.description}
                                onChange={(event) => updatePhoto(portfolio.key, photo.key, { description: event.target.value })}
                                className={inputClass(false)}
                              />
                            </Field>
                            <div className="mt-3 flex flex-wrap gap-4">
                              <button
                                type="button"
                                disabled={photoIndex === 0}
                                onClick={() => movePhoto(portfolio.key, photo.key, -1)}
                                className="text-[13px] text-[#242424] underline underline-offset-4 disabled:text-[#D9D9D9] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
                              >
                                Выше
                              </button>
                              <button
                                type="button"
                                disabled={photoIndex === portfolio.photos.length - 1}
                                onClick={() => movePhoto(portfolio.key, photo.key, 1)}
                                className="text-[13px] text-[#242424] underline underline-offset-4 disabled:text-[#D9D9D9] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
                              >
                                Ниже
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updatePortfolio(portfolio.key, {
                                    photos: portfolio.photos.filter((item) => item.key !== photo.key),
                                  })
                                }
                                className="text-[13px] text-[#767676] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
                              >
                                Удалить фото
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePortfolio(portfolio.key, { photos: [...portfolio.photos, emptyPhoto()] })}
                      className="mt-4 text-sm text-[#242424] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
                    >
                      Добавить фото
                    </button>
                  </section>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPortfolios((current) => [...current, emptyPortfolio()])}
                className="mt-8 inline-flex min-h-11 items-center border border-[#242424] bg-white px-5 text-sm text-[#242424] hover:bg-[#242424] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
              >
                Добавить портфолио
              </button>
            </div>
          ) : (
            <dl className="grid gap-5 text-sm">
              <div>
                <dt className="text-[13px] text-[#767676]">Имя</dt>
                <dd className="mt-1 text-[#242424]">
                  {firstName} {lastName}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#767676]">Электронная почта</dt>
                <dd className="mt-1 break-all text-[#242424]">{email}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#767676]">Телефон</dt>
                <dd className="mt-1 text-[#242424]">{phone}</dd>
              </div>
            </dl>
          )}
          {formError ? <p className="mt-6 text-sm leading-6 text-[#333333]">{formError}</p> : null}
          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goTo(2)}
              className="inline-flex min-h-11 items-center border border-[#D9D9D9] bg-white px-5 text-sm text-[#242424] hover:border-[#242424] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="inline-flex min-h-11 items-center bg-[#242424] px-5 text-sm text-white hover:bg-[#3A3A3A] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424] disabled:opacity-40"
            >
              {pending ? "Создаём аккаунт…" : "Создать аккаунт"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
      </div>
      {wide ? null : (
        <div className="relative hidden min-h-[80vh] lg:block">
          <img src="/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

function StepNav({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center border border-[#D9D9D9] bg-white px-5 text-sm text-[#242424] hover:border-[#242424] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
      >
        Назад
      </button>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center bg-[#242424] px-5 text-sm text-white hover:bg-[#3A3A3A] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242424]"
      >
        {label}
      </button>
    </div>
  );
}
