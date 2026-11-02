import { SiteShell } from "../site-shell";
import { ArtistJoin } from "../artist-join";

export const metadata = {
  title: "naidista — Я художник",
  description: "Вход и регистрация художника или организации на naidista.",
};

export default function ArtistPage() {
  return (
    <SiteShell>
      <ArtistJoin />
    </SiteShell>
  );
}
