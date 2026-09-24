import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { faltaSegundoFactor } from "@/lib/mfa";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Sin credenciales de Supabase no hay forma de saber quien es el usuario:
  // el panel se cierra en vez de quedar abierto. (Las paginas publicas no pasan
  // por aca, el matcher solo toma /admin.)
  if (!url || !anon) {
    return new NextResponse("Servicio no disponible", { status: 503 });
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && path.startsWith("/admin") && path !== "/admin/login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  // Contrasena puesta pero falta el codigo del segundo factor: al login, que
  // retoma directo en el paso del codigo. Esto es solo la pantalla: quien de
  // verdad corta el acceso a los datos es la base (es_admin() exige aal2 si
  // hay un factor verificado), asi que si esta consulta fallara no se abre nada.
  const garantia = user
    ? (await supabase.auth.mfa.getAuthenticatorAssuranceLevel()).data
    : null;
  const pendiente = faltaSegundoFactor(garantia);

  if (user && pendiente && path !== "/admin/login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && !pendiente && path === "/admin/login") {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
