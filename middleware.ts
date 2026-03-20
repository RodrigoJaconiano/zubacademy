import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/perfil/:path*",
    "/curso/:path*",
    "/quiz/:path*",
    "/certificado/:path*",
    "/admin/:path*",
  ],
};
