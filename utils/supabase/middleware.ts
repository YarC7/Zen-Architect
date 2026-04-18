import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/supabase";
import { fetchWithCache } from "@/utils/redis";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use ANON key consistently
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  // We extract the access_token out of the session directly to use as cache key
  const { data: { session } } = await supabase.auth.getSession();
  
  let user = session?.user || null;

  if (session?.access_token) {
    user = await fetchWithCache(
      `auth:user:${session.access_token}`,
      async () => {
        const { data } = await supabase.auth.getUser();
        return data.user;
      },
      60 // 1 minute TTL to dramatically cut down on db trips for rapid navigation
    );
  } else {
    // Fallback if no local session found
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // Route protection logic
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  
  // If no user and trying to access anything other than login, redirect to login
  // Note: Matcher in root middleware filters static assets already.
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user exists and trying to access login page, redirect to home/dashboard
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
