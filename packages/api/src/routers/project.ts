import prisma from "@contentforge/db";
import z from "zod";

import { protectedProcedure } from "../index";

export interface ProjectListItem {
	createdAt: Date;
	description: string;
	id: number;
	memberCount: number;
	name: string;
}

export interface ProjectCreateResult {
	description: string;
	id: number;
	name: string;
}

export interface ProjectJoinResult {
	id: number;
	projectId: number;
	role: string;
}

export interface ProjectMemberInfo {
	id: number;
	name: string;
	role: string;
}

export interface ProjectDetail {
	createdAt: Date;
	description: string;
	id: number;
	members: ProjectMemberInfo[];
	name: string;
	ownerId: number;
}

export const projectRouter = {
	list: protectedProcedure.handler(
		async ({ context }): Promise<ProjectListItem[]> => {
			const userId = Number(context.session.user.id);

			const memberships = await prisma.projectMember.findMany({
				where: { userId },
				include: {
					project: {
						include: {
							_count: { select: { projectMembers: true } },
						},
					},
				},
			});

			return memberships.map((m) => ({
				id: m.project.id,
				name: m.project.name,
				description: m.project.description,
				memberCount: m.project._count.projectMembers,
				createdAt: m.project.createdAt,
			}));
		}
	),

	create: protectedProcedure
		.input(
			z.object({
				name: z
					.string()
					.min(1, "请输入项目名称")
					.max(50, "项目名称不能超过 50 字"),
				description: z.string().max(200, "描述不能超过 200 字").optional(),
			})
		)
		.handler(async ({ context, input }): Promise<ProjectCreateResult> => {
			const userId = Number(context.session.user.id);

			const project = await prisma.$transaction(async (tx) => {
				const p = await tx.project.create({
					data: {
						name: input.name,
						description: input.description ?? "",
						ownerId: userId,
					},
				});

				await tx.projectMember.create({
					data: {
						userId,
						projectId: p.id,
						role: "ADMIN",
					},
				});

				return p;
			});

			return {
				id: project.id,
				name: project.name,
				description: project.description,
			};
		}),

	join: protectedProcedure
		.input(
			z.object({
				projectId: z.number("请输入项目 ID"),
			})
		)
		.handler(async ({ context, input }): Promise<ProjectJoinResult> => {
			const userId = Number(context.session.user.id);

			const project = await prisma.project.findUnique({
				where: { id: input.projectId },
			});

			if (!project) {
				throw new Error("项目不存在");
			}

			const existing = await prisma.projectMember.findUnique({
				where: {
					userId_projectId: { userId, projectId: input.projectId },
				},
			});

			if (existing) {
				throw new Error("你已经是该项目的成员");
			}

			const member = await prisma.projectMember.create({
				data: {
					userId,
					projectId: input.projectId,
					role: "EDITOR",
				},
			});

			return {
				id: member.id,
				projectId: member.projectId,
				role: member.role,
			};
		}),

	get: protectedProcedure
		.input(z.object({ projectId: z.number() }))
		.handler(async ({ context, input }): Promise<ProjectDetail> => {
			const userId = Number(context.session.user.id);

			const project = await prisma.project.findUnique({
				where: { id: input.projectId },
				include: {
					projectMembers: {
						include: {
							user: {
								select: { id: true, name: true },
							},
						},
					},
				},
			});

			if (!project) {
				throw new Error("项目不存在");
			}

			const isMember = project.projectMembers.some((m) => m.userId === userId);

			if (!isMember) {
				throw new Error("你没有权限访问该项目");
			}

			return {
				id: project.id,
				name: project.name,
				description: project.description,
				ownerId: project.ownerId,
				members: project.projectMembers.map((m) => ({
					id: m.user.id,
					name: m.user.name,
					role: m.role,
				})),
				createdAt: project.createdAt,
			};
		}),
};
