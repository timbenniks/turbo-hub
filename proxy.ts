import { auth } from "@/auth"

// Protect the authed app surface. Unauthenticated users are redirected to
// /login. Auth.js, API, static assets, and the public landing page are exempt.
export default auth((req) => {
  if (!req.auth) {
    const url = new URL("/login", req.nextUrl.origin)
    url.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return Response.redirect(url)
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/settings/:path*"],
}
