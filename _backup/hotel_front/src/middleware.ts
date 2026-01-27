import NextAuth from "next-auth";
import { authConfig } from "./auth";
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const email = req.auth?.user?.email;
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin);
    // newUrl.searchParams.append("callbackUrl", req.url);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ["/dashboard(.*)", "/((?!|_next/static|_next/image|favicon.ico).*)"],
};
