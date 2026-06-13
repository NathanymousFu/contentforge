import { beforeEach, describe, expect, it, mock } from "bun:test";
import { call } from "@orpc/server";

import { createMockSession } from "../test-utils";

let countResults: number[] = [];
let groupByResult: unknown[] = [];
let findManyResult: unknown[] = [];

const mockCount = mock(() => countResults.shift() ?? 0);
const mockGroupBy = mock(() => groupByResult);
const mockFindMany = mock(() => findManyResult);

mock.module("@contentforge/db", () => ({
	default: {
		content: {
			count: mockCount,
			groupBy: mockGroupBy,
			findMany: mockFindMany,
		},
	},
}));

const { contentRouter } = await import("./content");

const mockSession = createMockSession();

describe("content.getStats", () => {
	beforeEach(() => {
		countResults = [0, 0];
		groupByResult = [];
	});

	it("returns stats with valid session", async () => {
		countResults = [3, 5];
		groupByResult = [
			{ status: "DRAFT", _count: { status: 2 } },
			{ status: "PENDING", _count: { status: 5 } },
			{ status: "PUBLISHED", _count: { status: 1 } },
		];

		const result = await call(contentRouter.getStats, undefined, {
			context: { session: mockSession },
		});

		expect(result).toEqual({
			weeklyCount: 3,
			pendingCount: 5,
			statusDistribution: {
				DRAFT: 2,
				PENDING: 5,
				PUBLISHED: 1,
			},
		});
	});

	it("returns zeroes when there is no content", async () => {
		const result = await call(contentRouter.getStats, undefined, {
			context: { session: mockSession },
		});

		expect(result).toEqual({
			weeklyCount: 0,
			pendingCount: 0,
			statusDistribution: {},
		});
	});

	it("throws 请先登录 without session", () => {
		expect(
			call(contentRouter.getStats, undefined, {
				context: { session: null },
			})
		).rejects.toThrow("请先登录");
	});
});

describe("content.getRecent", () => {
	beforeEach(() => {
		findManyResult = [];
	});

	it("returns recent content with valid session", async () => {
		findManyResult = [
			{
				id: 1,
				title: "Post 1",
				status: "PUBLISHED",
				projectId: 10,
				updatedAt: new Date("2026-06-13"),
			},
			{
				id: 2,
				title: "Post 2",
				status: "DRAFT",
				projectId: 10,
				updatedAt: new Date("2026-06-12"),
			},
		];

		const result = await call(contentRouter.getRecent, undefined, {
			context: { session: mockSession },
		});

		expect(result).toHaveLength(2);
		expect(result[0]?.title).toBe("Post 1");
		expect(result[1]?.status).toBe("DRAFT");
	});

	it("returns empty array when no content", async () => {
		const result = await call(contentRouter.getRecent, undefined, {
			context: { session: mockSession },
		});

		expect(result).toEqual([]);
	});

	it("throws 请先登录 without session", () => {
		expect(
			call(contentRouter.getRecent, undefined, {
				context: { session: null },
			})
		).rejects.toThrow("请先登录");
	});
});
