"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getImageUrl } from "./media-url";
import { ProductDialog, type ProductCardData } from "./product-card";

export type CatalogFilters = {
  category: string[];
  color: string[];
  texture: string[];
  material: string[];
  style: string[];
  format: string[];
  subject: string[];
};

export const emptyFilters: CatalogFilters = {
  category: [],
  color: [],
  texture: [],
  material: [],
  style: [],
  format: [],
  subject: [],
};

export type CatalogProduct = {
  id: number;
  title: string;
  description?: string;
  price?: string;
  sellerId?: number;
  seller?: string;
  avatar?: string;
  image?: string;
  images?: string[];
  sphere?: string;
  category?: string;
  color?: string;
  texture?: string;
  material?: string[];
  style?: string;
  format?: string;
  subject?: string;
  quantity?: number;
  dimensions?: string;
  weight?: string;
  madeToOrder?: boolean;
  productionTime?: string;
  rating?: number | null;
  reviews?: { id: number; author: string; rating: number; text: string }[];
};

const GROUPS = [
  { id: "author", label: "Автор" },
  { id: "edition", label: "Тираж" },
  { id: "color", label: "Цветовая гамма" },
  { id: "format", label: "Формат" },
  { id: "material", label: "Материал" },
  { id: "style", label: "Стиль" },
] as const;

const SORTS = [
  { id: "popular", label: "По популярности" },
  { id: "new", label: "Сначала новые" },
  { id: "cheap", label: "Сначала дешевле" },
  { id: "expensive", label: "Сначала дороже" },
] as const;

type FilterId = (typeof GROUPS)[number]["id"];
type SortId = (typeof SORTS)[number]["id"];

const savedKey = "artbuild-saved-works";

function worksCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} работа`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} работы`;
  }
  return `${count} работ`;
}

function priceNumber(price?: string) {
  if (String(price ?? "").trim() === "") {
    return null;
  }
  const value = Number(String(price).replace(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function cardPrice(price?: string) {
  const value = priceNumber(price);
  if (value == null) {
    return "По запросу";
  }
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${digits} р`;
}

function productValue(product: CatalogProduct, id: FilterId) {
  if (id === "author") {
    return product.seller ?? "";
  }
  if (id === "edition") {
    return product.quantity == null ? "" : String(product.quantity);
  }
  if (id === "material") {
    return product.material ?? [];
  }
  return product[id] ?? "";
}

function editionLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} экземпляр`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} экземпляра`;
  }
  return `${count} экземпляров`;
}

function optionLabel(id: FilterId, value: string) {
  if (id === "edition") {
    return editionLabel(Number(value));
  }
  return value;
}

function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(savedKey) ?? "[]");
    return new Set<number>(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number") : []);
  } catch {
    return new Set<number>();
  }
}

export function ProductsCatalogList({
  products,
  filters,
}: {
  products: CatalogProduct[];
  filters: CatalogFilters;
}) {
  const bounds = useMemo(() => {
    const values = products.map((item) => priceNumber(item.price)).filter((value): value is number => value != null);
    if (values.length === 0) {
      return { min: 0, max: 0 };
    }
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [products]);
  const [category, setCategory] = useState<string | null>(null);
  const [picked, setPicked] = useState<Partial<Record<FilterId, string>>>({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("new");
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<string | null>("price");
  const [priceFrom, setPriceFrom] = useState(bounds.min);
  const [priceTo, setPriceTo] = useState(bounds.max);
  const needle = query.trim().toLocaleLowerCase("ru");
  const authors = useMemo(
    () => [...new Set(products.map((item) => item.seller).filter((name): name is string => Boolean(name)))].sort((left, right) => left.localeCompare(right, "ru")),
    [products],
  );
  const editions = useMemo(
    () => [...new Set(products.map((item) => item.quantity).filter((count): count is number => typeof count === "number"))].sort((left, right) => left - right),
    [products],
  );

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  const visible = useMemo(() => {
    const ranked = products.map((product, index) => ({ product, index }));
    const filtered = ranked.filter(({ product }) => {
      const sameCategory = category === null || product.category === category;
      const amount = priceNumber(product.price);
      const inPrice = amount == null ? priceFrom <= bounds.min && priceTo >= bounds.max : amount >= priceFrom && amount <= priceTo;
      const sameFacets = GROUPS.every((filter) => {
        const value = picked[filter.id];
        if (!value) {
          return true;
        }
        const current = productValue(product, filter.id);
        return Array.isArray(current) ? current.includes(value) : current === value;
      });
      const haystack = `${product.title} ${product.seller ?? ""} ${product.category ?? ""} ${(product.material ?? []).join(" ")}`.toLocaleLowerCase(
        "ru",
      );
      return sameCategory && inPrice && sameFacets && (needle.length === 0 || haystack.includes(needle));
    });
    filtered.sort((left, right) => {
      if (sort === "new") {
        return left.index - right.index;
      }
      if (sort === "cheap" || sort === "expensive") {
        const leftPrice = priceNumber(left.product.price);
        const rightPrice = priceNumber(right.product.price);
        if (leftPrice == null && rightPrice == null) {
          return left.index - right.index;
        }
        if (leftPrice == null) {
          return 1;
        }
        if (rightPrice == null) {
          return -1;
        }
        return sort === "cheap" ? leftPrice - rightPrice : rightPrice - leftPrice;
      }
      const leftRating = left.product.rating ?? -1;
      const rightRating = right.product.rating ?? -1;
      if (rightRating !== leftRating) {
        return rightRating - leftRating;
      }
      const leftReviews = left.product.reviews?.length ?? 0;
      const rightReviews = right.product.reviews?.length ?? 0;
      if (rightReviews !== leftReviews) {
        return rightReviews - leftReviews;
      }
      return left.index - right.index;
    });
    return filtered.map((item) => item.product);
  }, [products, category, picked, needle, sort, priceFrom, priceTo, bounds.min, bounds.max]);

  function choose(id: FilterId, value: string | null) {
    setPicked((current) => {
      const next = { ...current };
      if (!value || next[id] === value) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next;
    });
  }

  function reset() {
    setCategory(null);
    setPicked({});
    setQuery("");
    setPriceFrom(bounds.min);
    setPriceTo(bounds.max);
    setOpen("price");
  }

  function clampFrom(value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    setPriceFrom(Math.min(Math.max(Math.round(value), bounds.min), priceTo));
  }

  function clampTo(value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    setPriceTo(Math.max(Math.min(Math.round(value), bounds.max), priceFrom));
  }

  function groupOptions(id: FilterId) {
    if (id === "author") {
      return authors;
    }
    if (id === "edition") {
      return editions.map(String);
    }
    if (id === "color" || id === "format" || id === "material" || id === "style") {
      return filters[id] ?? [];
    }
    return [];
  }

  function toggleSaved(id: number) {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(savedKey, JSON.stringify([...next]));
      return next;
    });
  }

  const priceActive = priceFrom > bounds.min || priceTo < bounds.max;
  const chips = [
    ...(priceActive ? [{ id: "price", label: `${cardPrice(String(priceFrom))} – ${cardPrice(String(priceTo))}` }] : []),
    ...GROUPS.flatMap((filter) =>
      picked[filter.id] ? [{ id: filter.id, label: optionLabel(filter.id, picked[filter.id] as string) }] : [],
    ),
  ];

  return (
    <>
      <label className="mt-10 flex items-center gap-3 border-b border-[#DAD5CE]">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 fill-none stroke-[#77736E] stroke-[1.5]">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <span className="sr-only">Поиск по работам, мастерам и материалам</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по работам, мастерам и материалам"
          className="w-full bg-transparent py-3 text-base font-light text-[#242321] outline-none placeholder:text-[#77736E] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
        />
      </label>
      <div className="-mx-4 mt-6 flex gap-5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <CategoryButton active={category === null} onClick={() => setCategory(null)}>
          Все работы
        </CategoryButton>
        {filters.category.map((item) => (
          <CategoryButton key={item} active={item === category} onClick={() => setCategory(item === category ? null : item)}>
            {item}
          </CategoryButton>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-4 border-t border-[#DAD5CE] pt-4">
        <div className="flex items-center gap-4 text-sm text-[#77736E]">
          <p>{worksCount(visible.length)}</p>
          <label className="inline-flex items-center gap-2 text-[#242321]">
            <span className="sr-only">Сортировка</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortId)}
              className="bg-transparent py-2 text-sm text-[#242321] outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
            >
              {SORTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                if (chip.id === "price") {
                  setPriceFrom(bounds.min);
                  setPriceTo(bounds.max);
                  return;
                }
                choose(chip.id as FilterId, null);
              }}
              className="inline-flex min-h-9 items-center gap-2 border border-[#DAD5CE] bg-white px-3 text-[13px] text-[#242321] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
              <span className="sr-only">Убрать фильтр</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-start">
        <aside className="w-full shrink-0 md:w-72">
          <FilterSection label="Цена" open={open === "price"} onToggle={() => setOpen((current) => (current === "price" ? null : "price"))}>
            <PriceRange min={bounds.min} max={bounds.max} from={priceFrom} to={priceTo} onFrom={clampFrom} onTo={clampTo} />
          </FilterSection>
          {GROUPS.map((group) => (
            <FilterSection key={group.id} label={group.label} open={open === group.id} onToggle={() => setOpen((current) => (current === group.id ? null : group.id))}>
              <div className="flex flex-col items-start gap-1 pb-3">
                <FilterChoice active={!picked[group.id]} onClick={() => choose(group.id, null)}>
                  Все
                </FilterChoice>
                {groupOptions(group.id).map((value) => (
                  <FilterChoice key={value} active={picked[group.id] === value} onClick={() => choose(group.id, value)}>
                    {optionLabel(group.id, value)}
                  </FilterChoice>
                ))}
              </div>
            </FilterSection>
          ))}
          <button
            type="button"
            onClick={reset}
            className="mt-4 min-h-11 text-sm text-[#242321] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
          >
            Сбросить
          </button>
        </aside>
        {visible.length === 0 ? (
          <div className="min-w-0 flex-1 py-10">
            <p className="text-sm font-light leading-7 text-[#77736E]">Ничего не нашлось.</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 min-h-11 text-sm text-[#242321] underline underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <ul className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-12 min-[520px]:grid-cols-2 min-[520px]:gap-x-7 xl:grid-cols-3 xl:gap-x-8">
            {visible.map((product) => (
              <li key={product.id}>
                <CatalogCard product={product} saved={saved.has(product.id)} onSave={() => toggleSaved(product.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 pb-2 text-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321] ${
        active ? "border-b border-[#242321] text-[#242321]" : "text-[#77736E] hover:text-[#242321]"
      }`}
    >
      {children}
    </button>
  );
}

function FilterSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#E6E2DC]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3.5 text-left text-[15px] text-[#242321] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
      >
        {label}
        {open ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </button>
      {open ? children : null}
    </div>
  );
}

function PriceRange({
  min,
  max,
  from,
  to,
  onFrom,
  onTo,
}: {
  min: number;
  max: number;
  from: number;
  to: number;
  onFrom: (value: number) => void;
  onTo: (value: number) => void;
}) {
  const [fromText, setFromText] = useState(String(from));
  const [toText, setToText] = useState(String(to));
  const span = Math.max(max - min, 1);
  const start = ((from - min) / span) * 100;
  const end = ((to - min) / span) * 100;

  useEffect(() => {
    setFromText(String(from));
  }, [from]);

  useEffect(() => {
    setToText(String(to));
  }, [to]);
  const thumb =
    "pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[#C8C4BE] [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#C8C4BE] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-runnable-track]:bg-transparent";

  return (
    <div className="pb-4">
      <div className="relative mx-1 h-8">
        <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#D7D2CB]" />
        <div className="absolute top-1/2 h-px -translate-y-1/2 bg-[#242321]" style={{ left: `${start}%`, width: `${Math.max(end - start, 0)}%` }} />
        <input type="range" min={min} max={max} value={from} aria-label="Цена от" onChange={(event) => onFrom(Number(event.target.value))} className={`${thumb} z-10`} />
        <input type="range" min={min} max={max} value={to} aria-label="Цена до" onChange={(event) => onTo(Number(event.target.value))} className={`${thumb} z-20`} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-[#A39E98]">От</span>
          <input
            inputMode="numeric"
            value={fromText}
            onChange={(event) => setFromText(event.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => {
              const value = Number(fromText);
              if (!fromText || !Number.isFinite(value)) {
                setFromText(String(from));
                return;
              }
              onFrom(value);
            }}
            className="mt-1 w-full border border-[#E4E0DA] bg-white px-3 py-2 text-sm text-[#242321] outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#242321]"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[#A39E98]">До</span>
          <input
            inputMode="numeric"
            value={toText}
            onChange={(event) => setToText(event.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => {
              const value = Number(toText);
              if (!toText || !Number.isFinite(value)) {
                setToText(String(to));
                return;
              }
              onTo(value);
            }}
            className="mt-1 w-full border border-[#E4E0DA] bg-white px-3 py-2 text-sm text-[#242321] outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#242321]"
          />
        </label>
      </div>
    </div>
  );
}

function FilterChoice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 px-0 text-left text-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321] ${
        active ? "text-[#242321] underline underline-offset-4" : "text-[#77736E] hover:text-[#242321]"
      }`}
    >
      {children}
    </button>
  );
}

function CatalogCard({
  product,
  saved,
  onSave,
}: {
  product: CatalogProduct;
  saved: boolean;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const photos = (product.images?.length ? product.images : product.image ? [product.image] : []).map((src) => getImageUrl(src));
  const detail = product.category || product.material?.[0] || "";
  const card: ProductCardData = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    image: product.image,
    sphere: product.sphere,
    seller: product.seller,
    sellerId: product.sellerId,
    avatar: product.avatar,
    category: product.category,
    color: product.color,
    texture: product.texture,
    material: product.material,
    style: product.style,
    format: product.format,
    subject: product.subject,
    dimensions: product.dimensions,
    weight: product.weight,
    madeToOrder: product.madeToOrder,
    productionTime: product.productionTime,
    rating: product.rating,
    reviews: product.reviews,
  };

  return (
    <article>
      <div className="group relative overflow-hidden bg-[#E7E1D8]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
        >
          {photos[0] ? (
            <span className="relative block aspect-[3/4] w-full">
              <img
                src={photos[0]}
                alt=""
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              />
              {photos[1] ? (
                <img
                  src={photos[1]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
                />
              ) : null}
            </span>
          ) : (
            <span className="block aspect-[3/4] w-full bg-[#E7E1D8]" />
          )}
        </button>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Убрать из избранного" : "В избранное"}
          onClick={onSave}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-[#242321] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-5 w-5 stroke-current stroke-[1.5] ${saved ? "fill-[#242321]" : "fill-none"}`}>
            <path d="M12 19.2 5.4 13a3.6 3.6 0 0 1 5.1-5.1L12 9.2l1.5-1.3a3.6 3.6 0 0 1 5.1 5.1Z" />
          </svg>
        </button>
      </div>
      <div className="pt-4">
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium leading-tight text-[#242321]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
          >
            {product.title}
          </button>
        </h3>
        {product.seller ? (
          product.sellerId ? (
            <a
              href={`/masters/${product.sellerId}`}
              className="mt-2 block text-sm text-[#77736E] hover:text-[#242321] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#242321]"
            >
              {product.seller}
            </a>
          ) : (
            <p className="mt-2 text-sm text-[#77736E]">{product.seller}</p>
          )
        ) : null}
        {detail ? <p className="mt-1 text-[13px] text-[#77736E]">{detail}</p> : null}
        <p className="mt-3 text-sm text-[#242321]">{cardPrice(product.price)}</p>
      </div>
      {open ? <ProductDialog product={card} onClose={() => setOpen(false)} /> : null}
    </article>
  );
}
