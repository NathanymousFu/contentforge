import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@contentforge/db";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
	pages: {
		signIn: "/login",
	},
	providers: [
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "邮箱", type: "email" },
				password: { label: "密码", type: "password" },
			},
			async authorize(credentials) {
				if (!(credentials?.email && credentials?.password)) {
					return null;
				}

				const user = await prisma.user.findUnique({
					where: { email: credentials.email },
				});

				if (!user) {
					return null;
				}

				const passwordMatch = await bcrypt.compare(
					credentials.password,
					user.password
				);

				if (!passwordMatch) {
					return null;
				}

				return {
					id: String(user.id),
					email: user.email,
					name: user.name,
					role: user.role,
				};
			},
		}),
	],
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = (user as { role?: string }).role;
			}
			return token;
		},
		session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
			}
			return session;
		},
	},
};
