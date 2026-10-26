"use client";

import { SiteShell } from "../site-shell";
import { AuthPanel } from "../auth-panel";

export default function LoginPage() {
  return (
    <SiteShell>
      <AuthPanel initialMode="login" />
    </SiteShell>
  );
}
