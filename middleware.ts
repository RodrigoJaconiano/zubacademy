import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          response.cookies.set(name, "", options);
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // rotas públicas
  const publicRoutes = ["/", "/login", "/auth/callback"];

  if (!user && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, cep, city, state, address, number")
      .eq("id", user.id)
      .maybeSingle();

    const profileIncomplete =
      !profile?.name ||
      !profile?.phone ||
      !profile?.cep ||
      !profile?.city ||
      !profile?.state ||
      !profile?.address ||
      !profile?.number;

    // força completar perfil
    if (profileIncomplete && pathname !== "/perfil") {
      return NextResponse.redirect(new URL("/perfil", request.url));
    }

    // se já completou perfil e tenta acessar login
    if (!profileIncomplete && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/curso",
    "/quiz",
    "/certificado",
    "/perfil",
    "/login",
  ],
};
