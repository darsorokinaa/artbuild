"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "../site-shell";
import { AuthPanel } from "../auth-panel";

function RegisterForm() {
  const kind = useSearchParams().get("kind") === "master" ? "master" : "customer";
  return <AuthPanel initialMode="register" initialKind={kind} />;
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
