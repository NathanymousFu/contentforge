import { Card, CardContent } from "@contentforge/ui/components/card";

export default function ContentDetailPage() {
	return (
		<div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
			<Card>
				<CardContent className="py-12 text-center">
					<p className="text-lg text-muted-foreground">内容详情即将上线</p>
				</CardContent>
			</Card>
		</div>
	);
}
