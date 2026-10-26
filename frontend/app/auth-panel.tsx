"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount, type SessionUser } from "./account-provider";
import { MasterRegister } from "./master-register";

const fieldClass =
  "mt-1 w-full border-b border-[#1A1A1A]/20 bg-transparent pb-1.5 pt-0.5 text-[15px] font-light outline-none";

const buttonClass =
  "bg-[#1A1A1A] px-6 py-2 text-[11px] font-light uppercase tracking-[0.28em] text-white disabled:opacity-40";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-light uppercase tracking-[0.18em] text-[#1A1A1A]/50">{label}</span>
      {children}
    </label>
  );
}

function LineSwitch<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-8 ${className}`}>
      {options.map(([option, label]) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`border-b pb-1.5 text-[11px] font-light uppercase tracking-[0.22em] ${
              active ? "border-[#1A1A1A] text-[#1A1A1A]" : "border-transparent text-[#1A1A1A]/35"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function AuthPanel({
  initialMode = "login",
  initialKind = "customer",
}: {
  initialMode?: "login" | "register";
  initialKind?: "master" | "customer";
}) {
  const router = useRouter();
  const { setSession } = useAccount();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [kind, setKind] = useState<"master" | "customer">(initialKind);
  const [specialty, setSpecialty] = useState("master");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      if (mode === "login") {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.detail || "Не удалось войти.");
          return;
        }
        setSession(data.token, data.user as SessionUser);
        router.push("/account");
        return;
      }
      const password = String(form.get("password") || "");
      const repeat = String(form.get("repeat") || "");
      if (password !== repeat) {
        setError("Пароли не совпадают.");
        return;
      }
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          email: form.get("email"),
          phone: form.get("phone"),
          password,
          specialty: kind === "master" ? specialty : "",
          description: kind === "master" ? form.get("description") : "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Не удалось зарегистрироваться.");
        return;
      }
      setSession(data.token, data.user as SessionUser);
      router.push("/account");
    } catch {
      setError(mode === "login" ? "Вход временно недоступен." : "Регистрация временно недоступна.");
    } finally {
      setPending(false);
    }
  }

  const masterWizard = mode === "register" && kind === "master";

  return (
    <section className="px-6 py-6 md:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-[540px]">
        <p className="text-[11px] font-light uppercase tracking-[0.32em] text-[#1A1A1A]/45">Учётная запись</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[2.5rem] font-light leading-none">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-3">
          <LineSwitch
            value={mode}
            onChange={switchMode}
            options={[
              ["login", "Вход"],
              ["register", "Регистрация"],
            ]}
          />
          {mode === "register" ? (
            <LineSwitch
              value={kind}
              onChange={setKind}
              options={[
                ["customer", "Заказчик"],
                ["master", "Мастер"],
              ]}
            />
          ) : null}
        </div>
        {masterWizard ? <MasterRegister specialty={specialty} onSpecialty={setSpecialty} /> : null}
        {masterWizard ? null : (
          <form onSubmit={submit} className="mt-6 grid gap-5">
            {mode === "register" ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 min-[420px]:grid-cols-2">
                <Field label="Имя">
                  <input name="first_name" required className={fieldClass} />
                </Field>
                <Field label="Фамилия">
                  <input name="last_name" required className={fieldClass} />
                </Field>
                <Field label="Почта">
                  <input name="email" type="email" required className={fieldClass} />
                </Field>
                <Field label="Телефон">
                  <input name="phone" required className={fieldClass} />
                </Field>
                <Field label="Пароль">
                  <input name="password" type="password" required minLength={8} className={fieldClass} />
                </Field>
                <Field label="Пароль ещё раз">
                  <input name="repeat" type="password" required minLength={8} className={fieldClass} />
                </Field>
              </div>
            ) : (
              <>
                <Field label="Почта">
                  <input name="email" type="email" required className={fieldClass} />
                </Field>
                <Field label="Пароль">
                  <input name="password" type="password" required className={fieldClass} />
                </Field>
              </>
            )}
            {error ? <p className="text-sm font-light leading-7">{error}</p> : null}
            <div className="mt-1 flex justify-end max-[720px]:pr-16">
              <button type="submit" disabled={pending} className={buttonClass}>
                {mode === "login" ? "Войти" : "Создать учётную запись"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
