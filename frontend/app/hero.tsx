"use client";

import { useEffect, useRef, useState } from "react";

export function Hero() {
  const frameRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const title = titleRef.current;
    if (!frame || !title) {
      return;
    }

    const fit = () => {
      const target = frame.clientWidth * 0.96;
      title.style.fontSize = "100px";
      const width = title.getBoundingClientRect().width;
      if (width > 0) {
        title.style.fontSize = `${(100 * target) / width}px`;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => setPlaying(false));
  }, []);

  return (
    <section className="px-3 pt-2 md:px-5">
      <div
        ref={frameRef}
        className="relative min-h-[92vh] overflow-hidden rounded-[28px] bg-[#E7E1D8]"
      >
        <video
          ref={videoRef}
          src="/hero.mp4"
          poster="/hero.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F6F3EE]/55 via-[#F6F3EE]/15 to-transparent ${playing ? "opacity-40" : "opacity-100"}`}
        />
        <div className="pointer-events-none absolute inset-x-0 top-[7%] flex justify-center">
          <h1
            ref={titleRef}
            className="whitespace-nowrap text-center font-[family-name:var(--font-wordmark)] font-medium lowercase leading-[0.8] tracking-tight text-white/55"
          >
            blurrr
          </h1>
        </div>
        <div className="relative flex min-h-[92vh] flex-col justify-end px-6 py-10 md:px-10 md:py-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#1A1A1A]/55">Изделия и мастера</p>
          <p className="mt-4 max-w-md font-[family-name:var(--font-display)] text-3xl font-medium md:text-4xl">
            Изделия. Мастера. Задания.
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#1A1A1A]/70">
            Заказчики оставляют задание, мастера показывают изделия и берут работу.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/masters" className="rounded-full bg-[#1A1A1A] px-5 py-3 text-sm text-white">
              Мастера →
            </a>
            <a href="#catalog" className="rounded-full border border-[#1A1A1A]/15 bg-white/80 px-5 py-3 text-sm">
              Изделия
            </a>
          </div>
        </div>
        <a href="#catalog" className="absolute bottom-8 right-8 hidden text-[12px] text-[#1A1A1A]/60 md:block">
          Прокрутить ↓
        </a>
      </div>
    </section>
  );
}
