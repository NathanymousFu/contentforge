import { beforeEach, describe, expect, it, mock } from "bun:test";
import { call } from "@orpc/server";

import { createMockSession } from "../test-utils";

let projectFindUniqueResult: unknown = null;
const projectFindManyResult: unknown[] = [];
let projectMemberFindManyResult: unknown[] = [];
let projectMemberFindUniqueResult: unknown = null;
let projectMemberCreateResult: unknown = null;
let txProjectCreateResult: unknown = null;
let txProjectMemberCreateResult: unknown = null;

const mockProjectFindUnique = mock(() => projectFindUniqueResult);
const mockProjectFindMany = mock(() => projectFindManyResult);
const mockProjectMemberFindMany = mock(() => projectMemberFindManyResult);
const mockProjectMemberFindUnique = mock(() => projectMemberFindUniqueResult);
const mockProjectMemberCreate = mock(() => projectMemberCreateResult);
const mockTxProjectCreate = mock((data: any) => ({
	id: 1,
	...(data?.data ?? txProjectCreateResult),
}));
const mockTxProjectMemberCreate = mock(() => txProjectMemberCreateResult);

mock.module("@contentforge/db", () => ({
	default: {
		project: {
			findUnique: mockProjectFindUnique,
			findMany: mockProjectFindMany,
		},
		projectMember: {
			findMany: mockProjectMemberFindMany,
			findUnique: mockProjectMemberFindUnique,
			create: mockProjectMemberCreate,
		},
		$transaction: mock((fn: (tx: any) => any) =>
			fn({
				project: { create: mockTxProjectCreate },
				projectMember: { create: mockTxProjectMemberCreate },
			})
		),
	},
}));

const { projectRouter } = await import("./project");

const mockSession = createMockSession();

describe("project.list", () => {
	beforeEach(() => {
		projectMemberFindManyResult = [];
	});

	it("returns user's projects", async () => {
		projectMemberFindManyResult = [
			{
				project: {
					id: 1,
					name: "Project A",
					description: "Desc A",
					_count: { projectMembers: 3 },
					createdAt: new Date("2026-06-01"),
				},
			},
			{
				project: {
					id: 2,
					name: "Project B",
					description: "Desc B",
					_count: { projectMembers: 2 },
					createdAt: new Date("2026-06-05"),
				},
			},
		];

		const result = await call(projectRouter.list, undefined, {
			context: { session: mockSession },
		});

		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("Project A");
		expect(result[0]?.memberCount).toBe(3);
		expect(result[1]?.name).toBe("Project B");
		expect(result[1]?.memberCount).toBe(2);
	});

	it("returns empty array for new user", async () => {
		const result = await call(projectRouter.list, undefined, {
			context: { session: mockSession },
		});

		expect(result).toEqual([]);
	});

	it("throws 请先登录 without session", () => {
		expect(
			call(projectRouter.list, undefined, { context: { session: null } })
		).rejects.toThrow("请先登录");
	});
});

describe("project.create", () => {
	beforeEach(() => {
		txProjectCreateResult = {
			id: 1,
			name: "Test Project",
			description: "A test project",
			ownerId: 1,
		};
		txProjectMemberCreateResult = { id: 1 };
	});

	it("creates a project and returns it", async () => {
		const result = await call(
			projectRouter.create,
			{ name: "Test Project", description: "A test project" },
			{ context: { session: mockSession } }
		);

		expect(result).toEqual({
			id: 1,
			name: "Test Project",
			description: "A test project",
		});
	});

	it("creates a project without optional description", async () => {
		const result = await call(
			projectRouter.create,
			{ name: "Minimal" },
			{ context: { session: mockSession } }
		);

		expect(result.name).toBe("Minimal");
	});

	it("rejects empty name", () => {
		expect(
			call(
				projectRouter.create,
				{ name: "" },
				{ context: { session: mockSession } }
			)
		).rejects.toThrow();
	});

	it("rejects name over 50 chars", () => {
		expect(
			call(
				projectRouter.create,
				{ name: "A".repeat(51) },
				{ context: { session: mockSession } }
			)
		).rejects.toThrow();
	});

	it("rejects description over 200 chars", () => {
		expect(
			call(
				projectRouter.create,
				{ name: "Test", description: "A".repeat(201) },
				{ context: { session: mockSession } }
			)
		).rejects.toThrow();
	});

	it("throws 请先登录 without session", () => {
		expect(
			call(
				projectRouter.create,
				{ name: "Test" },
				{ context: { session: null } }
			)
		).rejects.toThrow("请先登录");
	});
});

describe("project.join", () => {
	beforeEach(() => {
		projectFindUniqueResult = { id: 5, name: "Target Project" };
		projectMemberFindUniqueResult = null;
		projectMemberCreateResult = { id: 1, projectId: 5, role: "EDITOR" };
	});

	it("joins an existing project", async () => {
		const result = await call(
			projectRouter.join,
			{ projectId: 5 },
			{ context: { session: mockSession } }
		);

		expect(result).toEqual({
			id: 1,
			projectId: 5,
			role: "EDITOR",
		});
	});

	it("rejects non-existent project", () => {
		projectFindUniqueResult = null;

		expect(
			call(
				projectRouter.join,
				{ projectId: 999 },
				{ context: { session: mockSession } }
			)
		).rejects.toThrow("项目不存在");
	});

	it("rejects already-joined project", () => {
		projectMemberFindUniqueResult = { id: 10, projectId: 5, userId: 1 };

		expect(
			call(
				projectRouter.join,
				{ projectId: 5 },
				{ context: { session: mockSession } }
			)
		).rejects.toThrow("你已经是该项目的成员");
	});

	it("rejects non-numeric projectId", () => {
		expect(
			call(
				projectRouter.join,
				// @ts-expect-error - testing runtime validation of Zod schema
				{ projectId: "abc" },
				{ context: { session: mockSession } }
			)
		).rejects.toThrow();
	});

	it("throws 请先登录 without session", () => {
		expect(
			call(projectRouter.join, { projectId: 1 }, { context: { session: null } })
		).rejects.toThrow("请先登录");
	});
});

describe("project.get", () => {
	const mockMembers = [
		{
			userId: 1,
			role: "ADMIN",
			user: { id: 1, name: "Alice" },
		},
		{
			userId: 2,
			role: "EDITOR",
			user: { id: 2, name: "Bob" },
		},
	];

	beforeEach(() => {
		projectFindUniqueResult = {
			id: 1,
			name: "Test Project",
			description: "A test",
			ownerId: 1,
			projectMembers: mockMembers,
			createdAt: new Date("2026-06-01"),
		};
	});

	it("returns project details with members", async () => {
		const result = await call(
			projectRouter.get,
			{ projectId: 1 },
			{ context: { session: createMockSession({ id: "1" }) } }
		);

		expect(result.name).toBe("Test Project");
		expect(result.members).toHaveLength(2);
		expect(result.members[0]?.name).toBe("Alice");
		expect(result.members[1]?.name).toBe("Bob");
	});

	it("rejects non-existent project", () => {
		projectFindUniqueResult = null;

		expect(
			call(
				projectRouter.get,
				{ projectId: 999 },
				{ context: { session: mockSession } }
			)
		).rejects.toThrow("项目不存在");
	});

	it("rejects non-member access", () => {
		expect(
			call(
				projectRouter.get,
				{ projectId: 1 },
				// User id=3 is not in the mockMembers list
				{ context: { session: createMockSession({ id: "3" }) } }
			)
		).rejects.toThrow("你没有权限访问该项目");
	});

	it("throws 请先登录 without session", () => {
		expect(
			call(projectRouter.get, { projectId: 1 }, { context: { session: null } })
		).rejects.toThrow("请先登录");
	});
});
