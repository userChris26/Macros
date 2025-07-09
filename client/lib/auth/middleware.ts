import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Create base response
  const response = NextResponse.next();

  // Get token from cookie
  const token = request.cookies.get('jwtToken')?.value;

  // Check if we're on a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/protected');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

  // If no token and trying to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    const redirectUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If has token and trying to access auth routes, redirect to protected area
  if (token && isAuthRoute) {
    const redirectUrl = new URL('/protected', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
} 