import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie
  const token = request.cookies.get("accessToken")?.value
  
  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/invite", "/f"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // If accessing public route, allow
  if (isPublicRoute || pathname === "/") {
    return NextResponse.next()
  }
  
  // If no token and trying to access protected route, redirect to login
  if (!token && (pathname.startsWith("/admin") || pathname.startsWith("/dashboard"))) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  // If we have a token, we need to check the role for admin routes
  // We'll decode the JWT to check the role (basic check, full validation happens on API)
  if (token && pathname.startsWith("/admin")) {
    try {
      // Decode JWT payload (base64)
      const payload = token.split(".")[1]
      const decoded = JSON.parse(atob(payload))
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role
      
      if (role !== "SuperAdmin") {
        // Not a super admin, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch {
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  
  // If we have a token and trying to access dashboard as SuperAdmin, redirect to admin
  if (token && pathname.startsWith("/dashboard")) {
    try {
      const payload = token.split(".")[1]
      const decoded = JSON.parse(atob(payload))
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role
      
      if (role === "SuperAdmin") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
    } catch {
      // Continue if decode fails
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
