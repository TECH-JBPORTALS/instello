export default async function Page({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}) {
	const { subdomain } = await params;

	return (
		<div className="flex h-svh text-4xl font-bold items-center justify-center">
			{subdomain.toUpperCase()} Organization Page
		</div>
	);
}
