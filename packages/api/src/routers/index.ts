import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { authRouter } from "./auth";
import { contentRouter } from "./content";
import { projectRouter } from "./project";
import { todoRouter } from "./todo";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => "OK"),
	auth: authRouter,
	content: contentRouter,
	project: projectRouter,
	todo: todoRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
