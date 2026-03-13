type AdminCheckInput = {
  email?: string | null;
  appRole?: string | null;
};

export function isZubaleAdminEmail(email?: string | null) {
  if (!email) return false;
  return email.toLowerCase().endsWith("@zubale.com");
}

export function isAdminRole(appRole?: string | null) {
  if (!appRole) return false;
  return appRole.trim().toLowerCase() === "admin";
}

export function isZubaleAdmin({ email, appRole }: AdminCheckInput) {
  return isZubaleAdminEmail(email) || isAdminRole(appRole);
}
