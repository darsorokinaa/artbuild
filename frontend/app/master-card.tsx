import { getImageUrl } from "./media-url";

type MasterPhoto = {
  src: string;
  description?: string;
};

type MasterCardProps = {
  name: string;
  role: string;
  avatar?: string;
  work?: string;
  description?: string;
  images?: MasterPhoto[];
  duration?: string;
  href?: string;
  index?: number;
};

const display = "font-[family-name:var(--font-display)]";

export function MasterCard({
  name,
  role,
  avatar,
  work,
  description,
  images = [],
  duration,
  href,
  index = 0,
}: MasterCardProps) {
  const photos = images.filter((photo) => photo.src);
  const [primary, secondary] = photos;

  return (
    <article
      className="group"
      style={{ animation: "rise 0.7s ease both", animationDelay: `${index * 80}ms` }}
    >
      <div className="relative pb-14">
        <div className="overflow-hidden bg-[#E7E1D8]">
          {primary ? (
            <img
              src={getImageUrl(primary.src)}
              alt={primary.description || work || name}
              className="aspect-[5/4] w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="aspect-[5/4] bg-[#E7E1D8]" />
          )}
        </div>
        {secondary ? (
          <img
            src={getImageUrl(secondary.src)}
            alt={secondary.description || ""}
            className="absolute bottom-0 right-6 aspect-[4/3] w-[46%] bg-[#E7E1D8] object-cover object-center shadow-[0_16px_40px_rgba(26,26,26,0.12)] transition duration-700 ease-out group-hover:-translate-y-1"
          />
        ) : null}
      </div>
      <div className="mt-2 flex items-end gap-4">
        {avatar ? (
          <img
            src={getImageUrl(avatar)}
            alt=""
            className="h-14 w-14 shrink-0 bg-[#E7E1D8] object-cover object-top"
          />
        ) : null}
        <h2 className={`${display} min-w-0 flex-1 text-4xl font-light leading-none tracking-tight md:text-5xl`}>
          {name}
        </h2>
        {href ? (
          <a
            href={href}
            className="mb-1 shrink-0 bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.18em] text-[#F6F3EE] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#1A1A1A]"
          >
            К мастеру
          </a>
        ) : null}
      </div>
      <p className="mt-4 text-sm font-light leading-7 text-[#1A1A1A]/70">{role}</p>
      {description ? <p className="mt-1 max-w-md text-sm font-light leading-7">{description}</p> : null}
      {work ? <p className="mt-1 max-w-md text-sm font-light leading-7">{work}</p> : null}
      {duration ? (
        <p className="mt-4 text-[11px] font-light uppercase tracking-[0.2em] text-[#1A1A1A]/45">
          {duration}
        </p>
      ) : null}
    </article>
  );
}

export function mastersCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} мастер`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} мастера`;
  }

  return `${count} мастеров`;
}
