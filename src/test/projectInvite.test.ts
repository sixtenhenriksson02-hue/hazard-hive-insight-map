import { describe, expect, it } from "vitest";
import { emailCallbackUrl, inviteFromQr, normalizeInviteCode, projectInvitePath } from "@/lib/projectInvite";

describe("Project QR access", () => {
  it("reads project links from a scanned QR", () => {
    expect(inviteFromQr("https://example.com/join/ABC123", "https://example.com")).toBe("ABC123");
    expect(inviteFromQr("/join/xyz789", "https://example.com")).toBe("XYZ789");
  });
  it("never follows a foreign QR or a non-project link", () => {
    expect(inviteFromQr("https://evil.example/join/ABC123", "https://example.com")).toBeNull();
    expect(inviteFromQr("https://example.com/auth", "https://example.com")).toBeNull();
    expect(inviteFromQr("javascript:alert(1)", "https://example.com")).toBeNull();
  });
  it("creates a separate project URL for each six-character code", () => {
    expect(projectInvitePath("ABC123")).toBe("/join/ABC123");
    expect(projectInvitePath("XYZ789")).toBe("/join/XYZ789");
  });
  it("keeps the project in the email link for another device", () => {
    expect(emailCallbackUrl("https://example.com", "ABC123")).toBe("https://example.com/auth?invite=ABC123");
  });
  it("rejects invalid codes and external redirect paths", () => {
    expect(normalizeInviteCode("https://evil.example")).toBeNull();
    expect(normalizeInviteCode("ABC12")).toBeNull();
    expect(normalizeInviteCode(" abc123 ")).toBe("ABC123");
    expect(emailCallbackUrl("https://example.com", "//evil.example")).toBe("https://example.com/auth");
  });
});