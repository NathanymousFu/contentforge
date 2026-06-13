"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@contentforge/ui/components/card";
import { Skeleton } from "@contentforge/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { orpc } from "@/utils/orpc";

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "草稿",
	PENDING: "待审核",
	APPROVED: "已通过",
	REJECTED: "已驳回",
	PUBLISHED: "已发布",
};

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) {
		return "早上好";
	}
	if (hour < 18) {
		return "下午好";
	}
	return "晚上好";
}

function StatusBadge({ status }: { status: string }) {
	const colors: Record<string, string> = {
		DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
		PENDING:
			"bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
		APPROVED:
			"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
		REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
		PUBLISHED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	};

	return (
		<span
			className={`inline-block rounded-full px-2 py-0.5 font-medium text-xs ${colors[status] ?? ""}`}
		>
			{STATUS_LABELS[status] ?? status}
		</span>
	);
}

export default function DashboardPage() {
	const { data: session } = useSession();

	const statsQuery = useQuery(orpc.content.getStats.queryOptions());
	const recentQuery = useQuery(orpc.content.getRecent.queryOptions());

	if (statsQuery.isLoading || recentQuery.isLoading) {
		return (
			<div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
				<Skeleton className="h-48" />
			</div>
		);
	}

	if (statsQuery.isError || recentQuery.isError) {
		return (
			<div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
				<p className="text-destructive">加载失败</p>
				<button
					className="inline-flex h-8 items-center justify-center gap-1.5 rounded-none border border-border bg-background px-2.5 font-medium text-xs hover:bg-muted"
					onClick={() => {
						statsQuery.refetch();
						recentQuery.refetch();
					}}
					type="button"
				>
					重试
				</button>
			</div>
		);
	}

	const stats = statsQuery.data ?? {
		weeklyCount: 0,
		pendingCount: 0,
		statusDistribution: {},
	};
	const recent = recentQuery.data ?? [];

	const isNewUser =
		stats.weeklyCount === 0 && stats.pendingCount === 0 && recent.length === 0;

	return (
		<div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
			<h1 className="font-bold text-2xl">
				{getGreeting()}，{session?.user?.name ?? "用户"}
			</h1>

			{isNewUser ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<p className="text-lg text-muted-foreground">
							还没有内容，去创建第一篇吧
						</p>
						<Link
							className="inline-flex h-8 items-center justify-center gap-1.5 rounded-none border border-transparent bg-primary px-2.5 font-medium text-primary-foreground text-xs"
							href="/projects"
						>
							创建项目
						</Link>
					</CardContent>
				</Card>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="font-normal text-muted-foreground text-sm">
									本周生成数
								</CardTitle>
							</CardHeader>
							<CardContent>
								<span className="font-bold text-3xl">{stats.weeklyCount}</span>
								<span className="ml-1 text-muted-foreground">篇</span>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="font-normal text-muted-foreground text-sm">
									待审核数
								</CardTitle>
							</CardHeader>
							<CardContent>
								<span className="font-bold text-3xl">{stats.pendingCount}</span>
								<span className="ml-1 text-muted-foreground">篇</span>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>状态分布</CardTitle>
						</CardHeader>
						<CardContent>
							{Object.keys(stats.statusDistribution).length > 0 ? (
								<div className="space-y-2">
									{Object.entries(stats.statusDistribution).map(
										([status, count]) => (
											<div className="flex items-center gap-2" key={status}>
												<StatusBadge status={status} />
												<span className="text-muted-foreground text-sm">
													{count as number} 篇
												</span>
											</div>
										)
									)}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">暂无数据</p>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>最近内容</CardTitle>
						</CardHeader>
						<CardContent>
							{recent.length > 0 ? (
								<div className="space-y-2">
									{recent.map((content) => (
										<Link
											className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted"
											href={`/projects/${content.projectId}/contents/${content.id}`}
											key={content.id}
										>
											<span className="font-medium">{content.title}</span>
											<div className="flex items-center gap-2 text-sm">
												<StatusBadge status={content.status} />
												<span className="text-muted-foreground">
													{new Date(content.updatedAt).toLocaleDateString(
														"zh-CN"
													)}
												</span>
											</div>
										</Link>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">暂无内容</p>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
