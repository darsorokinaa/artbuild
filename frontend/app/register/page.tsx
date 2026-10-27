"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "../site-shell";
import { MasterRegister } from "../master-register";

function RegisterForm() {
  const kind = useSearchParams().get("kind") === "master" ? "master" : "customer";
  return (
    <div className="overflow-x-clip bg-[#F5F3EF] text-[#242321] lg:grid lg:grid-cols-[minmax(0,650px)_minmax(0,1fr)]">
      <div className="px-5 py-10 sm:px-10 lg:px-14 lg:py-16">
        <MasterRegister initialKind={kind} />
      </div>
      <div className="relative hidden min-h-[80vh] lg:block">
        <img src="/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </SiteShell>
  );
}
