export function normalizeInviteCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z0-9]{6}$/.test(code) ? code : null;
}

export function projectInvitePath(code: string): string {
  const normalized = normalizeInviteCode(code);
  if (!normalized) throw new Error("Invalid project invite");
  return `/join/${normalized}`;
}

export function emailCallbackUrl(origin: string, invite: string | null): string {
  const url = new URL("/auth", origin);
  const code = normalizeInviteCode(invite);
  if (code) url.searchParams.set("invite", code);
  return url.toString();
}