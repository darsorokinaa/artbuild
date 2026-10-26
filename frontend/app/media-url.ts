export function getImageUrl(url?: string | null): string {
  if (!url) return "";

  if (process.env.NODE_ENV !== "production") {
    return url;
  }

  return url.replace(
    /^https?:\/\/(?:127\.0\.0\.1|localhost):8000(?=\/|$)/,
    ""
  );
}
