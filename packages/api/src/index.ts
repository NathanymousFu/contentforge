import { os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

export const protectedProcedure = o.use(({ context, next }) => {
	if (!context.session?.user) {
		throw new Error("请先登录");
	}

	return next({
		context: {
			...context,
			session: context.session,
		},
	});
});
