import { beforeEach, describe, expect, it, mock } from "bun:test";
import { call } from "@orpc/server";

let findUniqueResult: unknown = null;
let createResult: unknown = {
	id: 1,
	email: "test@example.com",
	name: "Test User",
};

const mockFindUnique = mock(() => findUniqueResult);
const mockCreate = mock(() => createResult);

mock.module("@contentforge/db", () => ({
	default: {
		user: {
			findUnique: mockFindUnique,
			create: mockCreate,
		},
	},
}));

const { authRouter } = await import("./auth");

const validInput = {
	email: "test@example.com",
	password: "12345678",
	name: "Test User",
};

describe("auth.register", () => {
	beforeEach(() => {
		findUniqueResult = null;
		createResult = { id: 1, email: "test@example.com", name: "Test User" };
	});

	it("creates a user and returns id, email, name", async () => {
		const result = await call(authRouter.register, validInput, {
			context: { session: null },
		});

		expect(result).toEqual({
			id: 1,
			email: "test@example.com",
			name: "Test User",
		});
		expect(mockCreate).toHaveBeenCalledTimes(1);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					email: "test@example.com",
					name: "Test User",
					role: "EDITOR",
				}),
			})
		);
	});

	it("throws 该邮箱已被注册 when email already exists", () => {
		findUniqueResult = {
			id: 2,
			email: "existing@example.com",
			name: "Existing",
		};

		expect(
			call(authRouter.register, validInput, { context: { session: null } })
		).rejects.toThrow("该邮箱已被注册");
	});

	it("rejects invalid email format", () =>
		expect(
			call(
				authRouter.register,
				{ ...validInput, email: "not-an-email" },
				{ context: { session: null } }
			)
		).rejects.toThrow());

	it("rejects short password", () =>
		expect(
			call(
				authRouter.register,
				{ ...validInput, password: "123" },
				{ context: { session: null } }
			)
		).rejects.toThrow());

	it("rejects empty name", () =>
		expect(
			call(
				authRouter.register,
				{ ...validInput, name: "" },
				{ context: { session: null } }
			)
		).rejects.toThrow());
});
