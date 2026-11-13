"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount, type SessionUser } from "./account-provider";

const focusRing =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]";

const fieldClass =
  "mt-2 w-full min-h-11 border-b bg-transparent pb-2 text-base text-[#242424] outline-none focus:border-[#242424]";

const boxButton = `inline-flex min-h-11 items-center justify-center border px-4 text-[12px] uppercase tracking-[0.14em] ${focusRing}`;

type Gate = "choose" | "login" | "register";
type Path = "artist" | "organization";
type StepId = "path" | "work" | "company" | "photos" | "about" | "materials" | "account";
type PhotoChoice = "own" | "studio";

const artistWorks = [
  ["painting", "Живопись"],
  ["graphic", "Графика"],
  ["furniture", "Работа с мебелью"],
  ["photo", "Фотография"],
  ["sculpture", "Скульптура"],
  ["textile", "Работа с текстилем"],
  ["tableware", "Работа с посудой"],
  ["other", "Другое"],
] as const;

const organizationWorks = [
  ["plaster", "Декоративные штукатурные работы"],
  ["furniture", "Мебель индивидуального изготовления"],
  ["mosaic", "Мозаика"],
  ["events", "Декор мероприятий"],
  ["other", "Другое"],
] as const;

const artistMaterials = [
  ["watercolor", "Акварель"],
  ["oil", "Масло"],
  ["ceramic", "Керамика"],
  ["plaster", "Штукатурка"],
  ["wood", "Дерево"],
] as const;

const organizationMaterials = [
  ["plastic", "Пластик"],
  ["gypsum", "Гипс"],
  ["ceramic", "Керамика"],
  ["plaster", "Штукатурка"],
  ["wood", "Дерево"],
  ["other", "Другое"],
] as const;

const stepLabels: Record<StepId, string> = {
  path: "Кто вы",
  work: "Работа",
  company: "О компании",
  photos: "Фото работ",
  about: "О себе",
  materials: "Материалы",
  account: "Аккаунт",
};

type WorkPhoto = { key: string; file: File };

let draftCount = 0;

function nextKey() {
  draftCount += 1;
  return `work-${draftCount}`;
}

function stepsFor(path: Path | null): StepId[] {
  if (path === "organization") {
    return ["path", "work", "company", "photos", "materials", "account"];
  }
  if (path === "artist") {
    return ["path", "work", "photos", "about", "materials", "account"];
  }
  return ["path"];
}

function inputClass(invalid: boolean) {
  return `${fieldClass} ${invalid ? "border-[#333333]" : "border-[#D9D9D9]"} ${focusRing}`;
}

function FilePick({ label, file, onChange }: { label: string; file: File | null; onChange: (file: File | null) => void }) {
  return (
    <div>
      <span className="text-[13px] text-[#767676]">{label}</span>
      <label className={`${boxButton} mt-3 cursor-pointer border-[#1A1A1A] bg-[#1A1A1A] px-6 text-white hover:bg-[#2A2A2A]`}>
        Выбрать файл
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {file ? <span className="mt-3 block text-sm text-[#242424]">{file.name}</span> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-[13px] text-[#767676]">{label}</span>
      {hint ? <span className="mt-1 block text-[13px] leading-5 text-[#767676]">{hint}</span> : null}
      {children}
    </label>
  );
}

function MaterialChips({
  options,
  picked,
  onToggle,
  onClear,
}: {
  options: readonly (readonly [string, string])[];
  picked: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {picked.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className={`inline-flex min-h-10 items-center gap-2 border border-[#1A1A1A] bg-[#F4F4F4] px-3 text-sm text-[#1A1A1A] ${focusRing}`}
        >
          <span aria-hidden="true">×</span>
          Сбросить
        </button>
      ) : null}
      {options.map(([id, label]) => {
        const active = picked.includes(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            aria-expanded={id === "other" ? active : undefined}
            onClick={() => onToggle(id)}
            className={`inline-flex min-h-10 items-center gap-2 border px-3 text-sm ${focusRing} ${
              active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#D6D6D6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            {label}
            {id === "other" ? (
              <svg viewBox="0 0 12 12" aria-hidden="true" className={`h-3 w-3 fill-none stroke-current stroke-[1.5] ${active ? "rotate-180" : ""}`}>
                <path d="M2 4.5 6 8l4-3.5" />
              </svg>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceList({
  options,
  picked,
  onToggle,
}: {
  options: readonly (readonly [string, string])[];
  picked: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {options.map(([id, label], index) => {
        const active = picked.includes(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(id)}
            className={`flex min-h-11 items-center gap-3 border px-4 text-left text-sm ${focusRing} ${
              active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <span className="w-5 shrink-0 text-[12px] tracking-[0.08em]">{index + 1}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PhotoPreview({ file }: { file: File }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null;
}

export function ArtistJoin() {
  const router = useRouter();
  const { setSession } = useAccount();
  const sending = useRef(false);
  const [gate, setGate] = useState<Gate>("choose");
  const [path, setPath] = useState<Path | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [works, setWorks] = useState<string[]>([]);
  const [workOther, setWorkOther] = useState("");
  const [photoChoice, setPhotoChoice] = useState<PhotoChoice | null>(null);
  const [photos, setPhotos] = useState<WorkPhoto[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [education, setEducation] = useState("");
  const [portrait, setPortrait] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialOther, setMaterialOther] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const steps = stepsFor(path);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const workOptions = path === "organization" ? organizationWorks : artistWorks;
  const materialOptions = path === "organization" ? organizationMaterials : artistMaterials;

  function toggle(list: string[], id: string, setList: (next: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
    setError("");
  }

  function problemFor(current: StepId) {
    if (current === "path") {
      return path ? "" : "Выберите, кто регистрируется.";
    }
    if (current === "work") {
      if (works.length === 0 || (works.includes("other") && !workOther.trim())) {
        return "Выберите, чем вы занимаетесь.";
      }
      return "";
    }
    if (current === "company") {
      if (!displayName.trim()) {
        return "Укажите название.";
      }
      if (!description.trim()) {
        return "Опишите предлагаемые работы.";
      }
      if (!portrait) {
        return "Добавьте логотип.";
      }
      return "";
    }
    if (current === "photos") {
      if (!photoChoice) {
        return "Выберите, как поступить с фотографиями.";
      }
      if (photoChoice === "own" && photos.length === 0) {
        return "Добавьте фотографии работ.";
      }
      return "";
    }
    if (current === "about") {
      if (!displayName.trim()) {
        return "Укажите имя или псевдоним.";
      }
      const years = Number(age);
      if (!age.trim() || !Number.isInteger(years) || years < 1 || years > 120) {
        return "Укажите возраст.";
      }
      if (!education.trim()) {
        return "Укажите образование.";
      }
      if (!portrait) {
        return "Добавьте фото.";
      }
      if (!description.trim()) {
        return "Опишите ваше искусство.";
      }
      return "";
    }
    if (current === "materials") {
      if (materials.length === 0 || (materials.includes("other") && !materialOther.trim())) {
        return "Выберите материалы.";
      }
      return "";
    }
    const mail = email.trim();
    if (mail.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      return "Укажите почту.";
    }
    if (phone.trim().length < 6) {
      return "Укажите телефон.";
    }
    if (password.length < 8) {
      return "Пароль должен быть не короче 8 символов.";
    }
    if (password !== repeat) {
      return "Пароли не совпадают.";
    }
    return "";
  }

  function goNext() {
    const problem = problemFor(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current) {
      return;
    }
    sending.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Не удалось войти.");
        sending.current = false;
        setPending(false);
        return;
      }
      setSession(data.token, data.user as SessionUser);
      router.push("/account");
    } catch {
      setError("Вход временно недоступен.");
      sending.current = false;
      setPending(false);
    }
  }

  async function submit() {
    if (sending.current || !path) {
      return;
    }
    for (const item of steps) {
      const problem = problemFor(item);
      if (problem) {
        setError(problem);
        setStepIndex(steps.indexOf(item));
        return;
      }
    }
    sending.current = true;
    setPending(true);
    setError("");
    const body = new FormData();
    body.set("kind", path);
    body.set("works", JSON.stringify(works));
    body.set("work_other", workOther.trim());
    body.set("photo_choice", photoChoice || "");
    body.set("display_name", displayName.trim());
    body.set("description", description.trim());
    body.set("materials", JSON.stringify(materials));
    body.set("material_other", materialOther.trim());
    body.set("email", email.trim());
    body.set("phone", phone.trim());
    body.set("password", password);
    if (path === "artist") {
      body.set("age", age.trim());
      body.set("education", education.trim());
    }
    if (portrait) {
      body.set("portrait", portrait);
    }
    photos.forEach((photo, index) => body.append(`work_${index}`, photo.file));
    try {
      const response = await fetch("/api/register", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Не удалось зарегистрироваться.");
        sending.current = false;
        setPending(false);
        return;
      }
      setSession(data.token, data.user as SessionUser);
      router.push("/account");
    } catch {
      setError("Регистрация временно недоступна.");
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <div className="px-8 py-12 sm:px-12 md:px-[16.8rem] md:py-16">
      <div className="w-full max-w-3xl pb-24">
        <p className="text-[11px] tracking-[0.28em] text-[#767676]">
          <span className="lowercase">naidista</span>
          <span className="uppercase"> / Я художник</span>
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] text-[#242424] sm:text-5xl">
          {gate === "login" ? "Войти" : gate === "register" ? "Регистрация" : "Я художник"}
        </h1>

        {gate === "choose" ? (
          <div className="mt-8">
            <p className="max-w-md text-sm leading-6 text-[#767676]">Войдите в аккаунт или зарегистрируйтесь.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => setGate("login")} className={`${boxButton} border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]`}>
                Войти
              </button>
              <button
                type="button"
                onClick={() => setGate("register")}
                className={`${boxButton} border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F4]`}
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        ) : null}

        {gate === "login" ? (
          <form noValidate className="mt-8 max-w-md" onSubmit={login}>
            <div className="grid gap-6">
              <Field label="Электронная почта">
                <input
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className={inputClass(false)}
                />
              </Field>
              <Field label="Пароль">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className={inputClass(false)}
                />
              </Field>
            </div>
            {error ? <p className="mt-6 text-sm leading-6 text-[#333333]">{error}</p> : null}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="submit" disabled={pending} className={`${boxButton} border-[#1A1A1A] bg-[#1A1A1A] text-white disabled:opacity-40`}>
                Войти
              </button>
              <button type="button" onClick={() => { setGate("choose"); setError(""); }} className="text-sm text-[#767676] underline underline-offset-4">
                Назад
              </button>
            </div>
          </form>
        ) : null}

        {gate === "register" ? (
          <div className="mt-8">
            <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {steps.map((item, index) => {
                const active = index === stepIndex;
                const reached = index <= stepIndex;
                return (
                  <li key={item}>
                    <button
                      type="button"
                      aria-current={active ? "step" : undefined}
                      onClick={() => {
                        if (index < stepIndex) {
                          setError("");
                          setStepIndex(index);
                        }
                      }}
                      className={`w-full text-left ${focusRing}`}
                    >
                      <span className={`block h-px ${reached ? "bg-[#242424]" : "bg-[#D9D9D9]"}`} />
                      <span className={`mt-2 block text-[11px] tracking-[0.14em] ${active ? "text-[#242424]" : "text-[#767676]"}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`mt-1 block text-[13px] leading-5 ${active ? "text-[#242424]" : "text-[#767676]"}`}>
                        {stepLabels[item]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-10">
              {step === "path" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["organization", "Мы организация, оказывающая услуги"],
                      ["artist", "Я мастер / художник"],
                    ] as const
                  ).map(([value, label]) => {
                    const active = path === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          if (path !== value) {
                            setWorks([]);
                            setMaterials([]);
                            setWorkOther("");
                            setMaterialOther("");
                          }
                          setPath(value);
                          setError("");
                        }}
                        className={`min-h-24 border px-4 text-left text-sm leading-6 ${focusRing} ${
                          active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {step === "work" ? (
                <div>
                  <h2 className="text-lg text-[#242424]">Что ваша работа?</h2>
                  <div className="mt-5">
                    <ChoiceList options={workOptions} picked={works} onToggle={(id) => toggle(works, id, setWorks)} />
                  </div>
                  {works.includes("other") ? (
                    <div className="mt-6">
                      <Field label="Описание">
                        <textarea value={workOther} onChange={(event) => setWorkOther(event.target.value)} rows={3} className={`${inputClass(false)} min-h-24 resize-y`} />
                      </Field>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === "company" ? (
                <div className="grid gap-6">
                  <h2 className="text-lg text-[#242424]">О компании</h2>
                  <Field label="Название">
                    <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass(false)} />
                  </Field>
                  <Field label="Описание предлагаемых работ">
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={`${inputClass(false)} min-h-28 resize-y`} />
                  </Field>
                  <FilePick label="Логотип" file={portrait} onChange={setPortrait} />
                  {portrait ? (
                    <div className="h-28 w-28 border border-[#E6E6E6] bg-white">
                      <PhotoPreview file={portrait} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === "photos" ? (
                <div>
                  <h2 className="text-lg text-[#242424]">Фото работ</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#767676]">Оцените качество фотографий ваших работ.</p>
                  <div className="mt-5 grid gap-3">
                    {(
                      [
                        ["own", "Готов выставлять в каталог вложенные фотографии"],
                        ["studio", "Хотел бы заказать профессиональную съемку"],
                      ] as const
                    ).map(([value, label]) => {
                      const active = photoChoice === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setPhotoChoice(value);
                            setError("");
                          }}
                          className={`min-h-11 border px-4 text-left text-sm ${focusRing} ${
                            active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E6E6E6] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <label className={`${boxButton} mt-6 cursor-pointer border-[#1A1A1A] bg-[#1A1A1A] px-6 text-white hover:bg-[#2A2A2A]`}>
                    Выбрать файлы
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        const files = [...(event.target.files ?? [])];
                        setPhotos((current) => [...current, ...files.map((file) => ({ key: nextKey(), file }))].slice(0, 12));
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {photos.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-3">
                      {photos.map((photo) => (
                        <li key={photo.key} className="w-28">
                          <div className="h-28 border border-[#E6E6E6] bg-white">
                            <PhotoPreview file={photo.file} />
                          </div>
                          <button
                            type="button"
                            onClick={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))}
                            className="mt-2 text-[12px] text-[#767676] underline underline-offset-4"
                          >
                            Удалить
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {step === "about" ? (
                <div className="grid gap-6">
                  <h2 className="text-lg text-[#242424]">О себе</h2>
                  <Field label="Имя или псевдоним">
                    <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass(false)} />
                  </Field>
                  <Field label="Возраст" hint="Не показывается в профиле.">
                    <input inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} className={inputClass(false)} />
                  </Field>
                  <Field label="Образование">
                    <input value={education} onChange={(event) => setEducation(event.target.value)} className={inputClass(false)} />
                  </Field>
                  <FilePick label="Фото" file={portrait} onChange={setPortrait} />
                  {portrait ? (
                    <div className="h-28 w-28 border border-[#E6E6E6] bg-white">
                      <PhotoPreview file={portrait} />
                    </div>
                  ) : null}
                  <Field label="Описание вашего искусства">
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={`${inputClass(false)} min-h-28 resize-y`} />
                  </Field>
                </div>
              ) : null}

              {step === "materials" ? (
                <div>
                  <h2 className="text-lg text-[#242424]">Материалы, которые используете в работе</h2>
                  <div className="mt-5">
                    <MaterialChips
                      options={materialOptions}
                      picked={materials}
                      onToggle={(id) => toggle(materials, id, setMaterials)}
                      onClear={() => {
                        setMaterials([]);
                        setMaterialOther("");
                        setError("");
                      }}
                    />
                  </div>
                  {materials.includes("other") ? (
                    <div className="mt-6">
                      <Field label="Описание">
                        <textarea value={materialOther} onChange={(event) => setMaterialOther(event.target.value)} rows={3} className={`${inputClass(false)} min-h-24 resize-y`} />
                      </Field>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === "account" ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Электронная почта">
                    <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass(false)} />
                  </Field>
                  <Field label="Телефон">
                    <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass(false)} />
                  </Field>
                  <Field label="Пароль">
                    <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass(false)} />
                  </Field>
                  <Field label="Повтор пароля">
                    <input type="password" autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} className={inputClass(false)} />
                  </Field>
                </div>
              ) : null}
            </div>

            {error ? <p className="mt-6 text-sm leading-6 text-[#333333]">{error}</p> : null}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  if (stepIndex === 0) {
                    setGate("choose");
                    return;
                  }
                  setStepIndex((current) => current - 1);
                }}
                className="text-sm text-[#767676] underline underline-offset-4"
              >
                Назад
              </button>
              {step === "account" ? (
                <button type="button" disabled={pending} onClick={submit} className={`${boxButton} border-[#1A1A1A] bg-[#1A1A1A] text-white disabled:opacity-40`}>
                  Создать аккаунт
                </button>
              ) : (
                <button type="button" onClick={goNext} className={`${boxButton} border-[#1A1A1A] bg-[#1A1A1A] text-white`}>
                  Дальше
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
