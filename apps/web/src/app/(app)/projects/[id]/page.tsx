"use client";

import { Card, CardContent } from "@contentforge/ui/components/card";
import { Skeleton } from "@contentforge/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@contentforge/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { orpc } from "@/utils/orpc";

function MemberAvatar({ name }: { name: string }) {
	const initial = name.charAt(0).toUpperCase();
	return (
		<div
			className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs ring-2 ring-background"
			title={name}
		>
			{initial}
		</div>
	);
}

function MemberAvatars({ members }: { members: { name: string }[] }) {
	return (
		<div className="flex -space-x-2">
			{members.map((m, i) => (
				<MemberAvatar key={i} name={m.name} />
			))}
		</div>
	);
}

export default function ProjectDetailPage() {
	const { id } = useParams<{ id: string }>();
	const projectId = Number(id);

	const query = useQuery(
		orpc.project.get.queryOptions({ input: { projectId } })
	);

	if (query.isLoading) {
		return (
			<div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-6 w-96" />
				<Skeleton className="h-64" />
			</div>
		);
	}

	if (query.isError || !query.data) {
		return (
			<div className="container mx-auto flex items-center justify-center px-4 py-12">
				<div className="text-center">
					<p className="text-lg text-muted-foreground">项目不存在</p>
					<Link
						className="mt-4 inline-flex h-8 items-center justify-center gap-1.5 rounded-none border border-border bg-background px-2.5 font-medium text-xs hover:bg-muted"
						href="/projects"
					>
						返回项目列表
					</Link>
				</div>
			</div>
		);
	}

	const project = query.data;

	return (
		<div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<h1 className="font-bold text-2xl">{project.name}</h1>
					{project.description && (
						<p className="text-muted-foreground text-sm">
							{project.description}
						</p>
					)}
				</div>
				<MemberAvatars members={project.members} />
			</div>

			<Tabs defaultValue="content">
				<TabsList>
					<TabsTrigger value="content">内容</TabsTrigger>
					<TabsTrigger value="templates">模板</TabsTrigger>
				</TabsList>
				<TabsContent value="content">
					<Card>
						<CardContent className="py-12 text-center">
							<p className="text-lg text-muted-foreground">
								还没有内容，新建第一篇吧
							</p>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="templates">
					<Card>
						<CardContent className="py-12 text-center">
							<p className="text-lg text-muted-foreground">
								还没有模板，创建第一个吧
							</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<div className="fixed right-6 bottom-6">
				<Link
					className="inline-flex h-9 items-center justify-center gap-1.5 rounded-none border border-transparent bg-primary px-2.5 font-medium text-primary-foreground text-xs"
					href={`/projects/${project.id}/contents/new`}
				>
					新建内容
				</Link>
			</div>
		</div>
	);
}
