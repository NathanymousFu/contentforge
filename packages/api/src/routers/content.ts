import prisma from "@contentforge/db";

import { protectedProcedure } from "../index";

export interface Stats {
	pendingCount: number;
	statusDistribution: Record<string, number>;
	weeklyCount: number;
}

export interface RecentContent {
	id: number;
	projectId: number;
	status: string;
	title: string;
	updatedAt: Date;
}

export const contentRouter = {
	getStats: protectedProcedure.handler(async ({ context }): Promise<Stats> => {
		const userId = Number(context.session.user.id);

		const weekStart = new Date();
		weekStart.setDate(weekStart.getDate() - weekStart.getDay());
		weekStart.setHours(0, 0, 0, 0);

		const [weeklyCount, pendingCount, statusCounts] = await Promise.all([
			prisma.content.count({
				where: {
					authorId: userId,
					createdAt: { gte: weekStart },
				},
			}),
			prisma.content.count({
				where: { status: "PENDING" },
			}),
			prisma.content.groupBy({
				by: ["status"],
				_count: { status: true },
			}),
		]);

		const statusDistribution = Object.fromEntries(
			statusCounts.map((s) => [s.status, s._count.status])
		);

		return {
			weeklyCount,
			pendingCount,
			statusDistribution,
		};
	}),

	getRecent: protectedProcedure.handler(
		async ({ context }): Promise<RecentContent[]> => {
			const userId = Number(context.session.user.id);

			const contents = await prisma.content.findMany({
				where: { authorId: userId },
				orderBy: { updatedAt: "desc" },
				take: 5,
				select: {
					id: true,
					title: true,
					status: true,
					projectId: true,
					updatedAt: true,
				},
			});

			return contents;
		}
	),
};
