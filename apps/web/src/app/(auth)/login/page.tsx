"use client";

import { Button } from "@contentforge/ui/components/button";
import { Card, CardContent } from "@contentforge/ui/components/card";
import { Input } from "@contentforge/ui/components/input";
import { Label } from "@contentforge/ui/components/label";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { client } from "@/utils/orpc";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "login" | "register";

interface FormErrors {
	confirmPassword?: string;
	email?: string;
	form?: string;
	name?: string;
	password?: string;
}

function buttonLabel(loading: boolean, mode: Mode) {
	if (loading) {
		return "处理中...";
	}
	return mode === "login" ? "登录" : "注册";
}

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

	const [mode, setMode] = useState<Mode>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [name, setName] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(false);

	function validateLogin() {
		const errs: FormErrors = {};
		if (!email) {
			errs.email = "请输入邮箱";
		}
		if (!password) {
			errs.password = "请输入密码";
		}
		return errs;
	}

	function validateRegister() {
		const errs: FormErrors = {};
		if (!email) {
			errs.email = "请输入邮箱";
		} else if (!EMAIL_REGEX.test(email)) {
			errs.email = "请输入有效的邮箱格式";
		}
		if (!password) {
			errs.password = "请输入密码";
		} else if (password.length < 8) {
			errs.password = "密码至少需要 8 位";
		}
		if (!confirmPassword) {
			errs.confirmPassword = "请确认密码";
		} else if (password !== confirmPassword) {
			errs.confirmPassword = "两次输入的密码不一致";
		}
		if (!name) {
			errs.name = "请输入姓名";
		} else if (name.length > 50) {
			errs.name = "姓名不能超过 50 字";
		}
		return errs;
	}

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		const errs = validateLogin();
		setErrors(errs);
		if (Object.keys(errs).length > 0) {
			return;
		}

		setLoading(true);
		const result = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (result?.error) {
			setErrors({ form: "邮箱或密码错误" });
			setLoading(false);
			return;
		}

		window.location.href = callbackUrl;
		router.refresh();
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		const errs = validateRegister();
		setErrors(errs);
		if (Object.keys(errs).length > 0) {
			return;
		}

		setLoading(true);
		try {
			await client.auth.register({ email, password, name });
		} catch {
			setErrors({ form: "该邮箱已被注册" });
			setLoading(false);
			return;
		}

		const result = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (result?.error) {
			setErrors({ form: "注册成功，但自动登录失败，请手动登录" });
			setMode("login");
			setLoading(false);
			return;
		}

		router.push("/dashboard");
		router.refresh();
	}

	function switchMode(newMode: Mode) {
		setMode(newMode);
		setErrors({});
	}

	return (
		<div className="flex h-full items-center justify-center px-4">
			<Card className="w-full max-w-4xl overflow-hidden">
				<div className="flex flex-col md:flex-row">
					<div className="flex flex-col justify-center bg-muted p-8 md:w-1/2">
						<div className="space-y-2">
							<h1 className="font-bold font-mono text-3xl tracking-tight">
								ContentForge
							</h1>
							<p className="text-muted-foreground">
								AI 驱动的内容中台 — 从生产到发布，一站式搞定
							</p>
						</div>
					</div>

					<CardContent className="flex flex-col justify-center p-8 md:w-1/2">
						<h2 className="mb-6 font-semibold text-xl">
							{mode === "login" ? "登录" : "注册"}
						</h2>

						<form
							className="space-y-4"
							onSubmit={mode === "login" ? handleLogin : handleRegister}
						>
							<div className="space-y-2">
								<Label htmlFor="email">邮箱</Label>
								<Input
									id="email"
									onChange={(e) => setEmail(e.target.value)}
									placeholder="name@example.com"
									type="email"
									value={email}
								/>
								{errors.email && (
									<p className="text-destructive text-sm">{errors.email}</p>
								)}
							</div>

							{mode === "register" && (
								<div className="space-y-2">
									<Label htmlFor="name">姓名</Label>
									<Input
										id="name"
										onChange={(e) => setName(e.target.value)}
										placeholder="你的姓名"
										type="text"
										value={name}
									/>
									{errors.name && (
										<p className="text-destructive text-sm">{errors.name}</p>
									)}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="password">密码</Label>
								<Input
									id="password"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="至少 8 位"
									type="password"
									value={password}
								/>
								{errors.password && (
									<p className="text-destructive text-sm">{errors.password}</p>
								)}
							</div>

							{mode === "register" && (
								<div className="space-y-2">
									<Label htmlFor="confirmPassword">确认密码</Label>
									<Input
										id="confirmPassword"
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="再次输入密码"
										type="password"
										value={confirmPassword}
									/>
									{errors.confirmPassword && (
										<p className="text-destructive text-sm">
											{errors.confirmPassword}
										</p>
									)}
								</div>
							)}

							{errors.form && (
								<p className="text-destructive text-sm">{errors.form}</p>
							)}

							<Button className="w-full" disabled={loading} type="submit">
								{buttonLabel(loading, mode)}
							</Button>
						</form>

						<p className="mt-4 text-center text-sm">
							{mode === "login" ? (
								<>
									还没有账号？
									<button
										className="text-primary underline"
										onClick={() => switchMode("register")}
										type="button"
									>
										注册
									</button>
								</>
							) : (
								<>
									已有账号？
									<button
										className="text-primary underline"
										onClick={() => switchMode("login")}
										type="button"
									>
										登录
									</button>
								</>
							)}
						</p>
					</CardContent>
				</div>
			</Card>
		</div>
	);
}
