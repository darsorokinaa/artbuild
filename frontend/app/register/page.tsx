import { Suspense } from "react";
import { connection } from "next/server";
import { SiteShell } from "../site-shell";
import { MasterRegister } from "../master-register";

export const metadata = {
  title: "naidista — Регистрация",
  description: "Создайте профиль мастера или заказчика на naidista.",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; specialty?: string }>;
}) {
  return (
    <SiteShell>
      <Suspense fallback={<RegisterFallback />}>
        <RegisterBody searchParams={searchParams} />
      </Suspense>
    </SiteShell>
  );
}

async function RegisterBody({ searchParams }: { searchParams: Promise<{ kind?: string; specialty?: string }> }) {
  await connection();
  const params = await searchParams;
  const kind = params.kind === "master" ? "master" : "customer";
  const specialty = params.specialty === "architect" || params.specialty === "designer" ? params.specialty : "master";
  return <RegisterLayout kind={kind} specialty={specialty} />;
}

function RegisterLayout({
  kind,
  specialty = "master",
}: {
  kind: "master" | "customer";
  specialty?: "master" | "designer" | "architect";
}) {
  return (
    <div className="overflow-x-clip bg-[#F4F4F4] text-[#242424]">
      <MasterRegister initialKind={kind} initialSpecialty={specialty} />
    </div>
  );
}

function RegisterFallback() {
  return <RegisterLayout kind="customer" />;
}
