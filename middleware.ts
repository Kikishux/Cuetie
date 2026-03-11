// TODO: Next.js 16 deprecates middleware.ts in favor of the "proxy" convention.
// Migrate once @supabase/ssr adds proxy support.
// See: https://nextjs.org/docs/messages/middleware-to-proxy
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
