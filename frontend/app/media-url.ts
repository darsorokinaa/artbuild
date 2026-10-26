export function getImageUrl(url?: string | null): string {
  if (!url) return "";

  return url.replace(
    /^https?:\/\/(?:127\.0\.0\.1|localhost):8000(?=\/|$)/,
    ""
  );
}
