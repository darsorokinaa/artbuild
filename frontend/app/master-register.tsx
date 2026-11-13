"use client";

import { useRef, useState, type ReactNode } from "react";
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

type FieldName = "firstName" | "lastName" | "email" | "phone" | "password" | "repeat" | "description";

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
    sending.current = true;
    setPending(true);
    setFormError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          specialty: kind === "master" ? specialty : "",
          description: kind === "master" ? description.trim() : "",
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
      window.location.assign("/account");
    } catch {
      setFormError("Регистрация временно недоступна.");
      sending.current = false;
      setPending(false);
    }
  }

  const wide = step > 1;
  const specialtyLabel = specialties.find(([value]) => value === specialty)?.[1] ?? "";

  return (
    <div className={wide ? "" : "lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)]"}>
      <div className={wide ? "px-8 py-12 sm:px-12 md:px-[16.8rem] md:py-16" : "px-8 py-12 sm:px-12 lg:px-16 lg:py-16"}>
    <div className={`w-full pb-24 ${wide ? "mx-auto max-w-3xl" : ""}`}>
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
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
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
            {kind === "master" ? (
              <>
                <div>
                  <dt className="text-[13px] text-[#767676]">Специализация</dt>
                  <dd className="mt-1 text-[#242424]">{specialtyLabel}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-[#767676]">О себе</dt>
                  <dd className="mt-1 max-w-xl text-[#242424]">{description}</dd>
                </div>
              </>
            ) : null}
          </dl>
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
