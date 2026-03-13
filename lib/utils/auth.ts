export function isZubaleAdmin(email?: string | null) {
  if (!email) return false;
  return email.toLowerCase().endsWith("@zubale.com");
}
