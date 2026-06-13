import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	const token = await getToken({ req: request });

	if (pathname === "/login" && token) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	const isProtected =
		pathname.startsWith("/dashboard") || pathname.startsWith("/projects");

	if (isProtected && !token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
