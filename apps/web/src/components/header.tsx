"use client";

import { Button } from "@contentforge/ui/components/button";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
	const { data: session } = useSession();

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex items-center gap-4 text-lg">
					<Link href="/">Home</Link>
					<Link href="/dashboard">Dashboard</Link>
					<Link href="/ai">AI Chat</Link>
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					{session ? (
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm">
								{session.user?.name}
							</span>
							<Button
								onClick={() => signOut({ callbackUrl: "/login" })}
								size="sm"
								variant="ghost"
							>
								退出
							</Button>
						</div>
					) : (
						<Link
							className="inline-flex h-7 items-center justify-center gap-1 rounded-none px-2.5 font-medium text-xs hover:bg-muted"
							href="/login"
						>
							登录
						</Link>
					)}
				</div>
			</div>
			<hr />
		</div>
	);
}
