import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "./lib/auth-options";

export async function createContext(_req: NextRequest) {
	const session = await getServerSession(authOptions);

	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
