export const disposableEmailDomains = [
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "anonbox.net",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "moakt.com",
  "sharklasers.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempail.com",
  "tempmail.com",
  "tempmail.dev",
  "tempmailo.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
] as const;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getEmailDomain(email: string) {
  const normalized = normalizeEmail(email);
  const parts = normalized.split("@");

  if (parts.length !== 2) {
    return "";
  }

  return parts[1].trim();
}

export function isDisposableEmail(email: string) {
  const domain = getEmailDomain(email);

  if (!domain) {
    return false;
  }

  return disposableEmailDomains.includes(
    domain as (typeof disposableEmailDomains)[number]
  );
}
