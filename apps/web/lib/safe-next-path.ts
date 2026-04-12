/** Allow only same-origin relative redirects after login/signup. */
export function safeNextPath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("\\")) return "/";
  return t;
}
