import prisma from "@contentforge/db";
import bcrypt from "bcrypt";
import z from "zod";

import { publicProcedure } from "../index";

export const authRouter = {
	register: publicProcedure
		.input(
			z.object({
				email: z.string().email("请输入有效的邮箱地址"),
				password: z.string().min(8, "密码至少需要 8 位"),
				name: z.string().min(1, "请输入姓名").max(50, "姓名不能超过 50 字"),
			})
		)
		.handler(async ({ input }) => {
			const existing = await prisma.user.findUnique({
				where: { email: input.email },
			});

			if (existing) {
				throw new Error("该邮箱已被注册");
			}

			const hashedPassword = await bcrypt.hash(input.password, 10);

			const user = await prisma.user.create({
				data: {
					email: input.email,
					password: hashedPassword,
					name: input.name,
					role: "EDITOR",
				},
			});

			return {
				id: user.id,
				email: user.email,
				name: user.name,
			};
		}),
};
