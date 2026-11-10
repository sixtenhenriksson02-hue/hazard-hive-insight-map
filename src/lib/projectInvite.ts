export function normalizeInviteCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z0-9]{6}$/.test(code) ? code : null;
}

export function projectInvitePath(code: string): string {
  const normalized = normalizeInviteCode(code);
  if (!normalized) throw new Error("Invalid project invite");
  return `/join/${normalized}`;
}

export function inviteFromQr(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin) return null;
    const match = /^\/join\/([A-Za-z0-9]{6})\/?$/.exec(url.pathname);
    return match ? normalizeInviteCode(match[1]) : null;
  } catch { return null; }
}

export function emailCallbackUrl(origin: string, invite: string | null): string {
  const url = new URL("/auth", origin);
  const code = normalizeInviteCode(invite);
  if (code) url.searchParams.set("invite", code);
  return url.toString();
}