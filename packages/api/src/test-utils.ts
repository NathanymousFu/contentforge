export function createMockSession(
	overrides?: Partial<{
		id: string;
		role: string;
		name: string;
		email: string;
	}>
) {
	return {
		user: {
			id: overrides?.id ?? "1",
			role: overrides?.role ?? "EDITOR",
			name: overrides?.name ?? "Test User",
			email: overrides?.email ?? "test@example.com",
		},
		expires: new Date(Date.now() + 86_400 * 1000).toISOString(),
	};
}
