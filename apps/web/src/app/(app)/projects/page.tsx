"use client";

import { Button } from "@contentforge/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@contentforge/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@contentforge/ui/components/dialog";
import { Input } from "@contentforge/ui/components/input";
import { Label } from "@contentforge/ui/components/label";
import { Skeleton } from "@contentforge/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { client, orpc } from "@/utils/orpc";

const EMPTY_ICON = (
	<svg
		aria-label="空文件夹"
		className="mx-auto h-12 w-12 text-muted-foreground"
		fill="none"
		role="img"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={1.5}
		/>
	</svg>
);

export default function ProjectsPage() {
	const [createOpen, setCreateOpen] = useState(false);
	const [joinOpen, setJoinOpen] = useState(false);
	const [createName, setCreateName] = useState("");
	const [createDescription, setCreateDescription] = useState("");
	const [joinProjectId, setJoinProjectId] = useState("");
	const [createError, setCreateError] = useState("");
	const [joinError, setJoinError] = useState("");

	const query = useQuery(orpc.project.list.queryOptions());

	const createMutation = useMutation({
		mutationFn: () =>
			client.project.create({
				name: createName,
				description: createDescription || undefined,
			}),
		onSuccess: () => {
			setCreateOpen(false);
			setCreateName("");
			setCreateDescription("");
			setCreateError("");
			query.refetch();
		},
		onError: (err) => {
			setCreateError(err.message);
		},
	});

	const joinMutation = useMutation({
		mutationFn: () => client.project.join({ projectId: Number(joinProjectId) }),
		onSuccess: () => {
			setJoinOpen(false);
			setJoinProjectId("");
			setJoinError("");
			query.refetch();
		},
		onError: (err) => {
			setJoinError(err.message);
		},
	});

	function handleCreateSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!createName) {
			setCreateError("请输入项目名称");
			return;
		}
		createMutation.mutate();
	}

	function handleJoinSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!joinProjectId || Number.isNaN(Number(joinProjectId))) {
			setJoinError("请输入有效的项目 ID");
			return;
		}
		joinMutation.mutate();
	}

	function resetCreate() {
		setCreateOpen(false);
		setCreateName("");
		setCreateDescription("");
		setCreateError("");
	}

	function resetJoin() {
		setJoinOpen(false);
		setJoinProjectId("");
		setJoinError("");
	}

	if (query.isLoading) {
		return (
			<div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton className="h-32" key={i} />
					))}
				</div>
			</div>
		);
	}

	if (query.isError) {
		return (
			<div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
				<p className="text-destructive">加载失败</p>
				<Button onClick={() => query.refetch()} variant="outline">
					重试
				</Button>
			</div>
		);
	}

	const projects = query.data ?? [];

	return (
		<div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl">我的项目</h1>
				<div className="flex gap-2">
					<Dialog onOpenChange={resetCreate} open={createOpen}>
						<DialogTrigger render={<Button>创建项目</Button>} />
						<DialogContent>
							<DialogHeader>
								<DialogTitle>创建项目</DialogTitle>
								<DialogDescription>创建一个新的项目空间</DialogDescription>
							</DialogHeader>
							<form className="space-y-4" onSubmit={handleCreateSubmit}>
								<div className="space-y-2">
									<Label htmlFor="project-name">项目名称</Label>
									<Input
										id="project-name"
										maxLength={50}
										onChange={(e) => setCreateName(e.target.value)}
										placeholder="如：618 大促"
										value={createName}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="project-desc">描述（选填）</Label>
									<Input
										id="project-desc"
										maxLength={200}
										onChange={(e) => setCreateDescription(e.target.value)}
										placeholder="一句话说明项目用途"
										value={createDescription}
									/>
								</div>
								{createError && (
									<p className="text-destructive text-sm">{createError}</p>
								)}
								<Button
									className="w-full"
									disabled={createMutation.isPending}
									type="submit"
								>
									{createMutation.isPending ? "创建中..." : "创建"}
								</Button>
							</form>
						</DialogContent>
					</Dialog>

					<Dialog onOpenChange={resetJoin} open={joinOpen}>
						<DialogTrigger
							render={<Button variant="outline">加入项目</Button>}
						/>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>加入项目</DialogTitle>
								<DialogDescription>输入项目 ID 加入已有项目</DialogDescription>
							</DialogHeader>
							<form className="space-y-4" onSubmit={handleJoinSubmit}>
								<div className="space-y-2">
									<Label htmlFor="project-id">项目 ID</Label>
									<Input
										id="project-id"
										onChange={(e) => setJoinProjectId(e.target.value)}
										placeholder="请输入项目 ID"
										type="number"
										value={joinProjectId}
									/>
								</div>
								{joinError && (
									<p className="text-destructive text-sm">{joinError}</p>
								)}
								<Button
									className="w-full"
									disabled={joinMutation.isPending}
									type="submit"
								>
									{joinMutation.isPending ? "加入中..." : "加入"}
								</Button>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{projects.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						{EMPTY_ICON}
						<p className="text-lg text-muted-foreground">
							还没有项目，创建第一个吧
						</p>
						<div className="flex gap-2">
							<Button onClick={() => setCreateOpen(true)}>创建项目</Button>
							<Button onClick={() => setJoinOpen(true)} variant="outline">
								加入项目
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<Link
							className="block"
							href={`/projects/${project.id}`}
							key={project.id}
						>
							<Card className="h-full transition-shadow hover:shadow-md">
								<CardHeader>
									<CardTitle>{project.name}</CardTitle>
									{project.description && (
										<p className="line-clamp-2 text-muted-foreground text-xs">
											{project.description}
										</p>
									)}
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground text-xs">
										{project.memberCount} 位成员
									</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
