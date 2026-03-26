import { isZubaleAdmin } from "@/lib/utils/auth";

type CanAccessAdminInput = {
  email?: string | null;
  appRole?: string | null;
};

export function canAccessAdminPanel(input: CanAccessAdminInput) {
  return isZubaleAdmin({
    email: input.email,
    appRole: input.appRole,
  });
}
