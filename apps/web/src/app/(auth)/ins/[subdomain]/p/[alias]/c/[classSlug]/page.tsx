import { redirect } from "next/navigation";

export default async function ClassPage({
	params,
}: {
	params: Promise<{ alias: string; classSlug: string }>;
}) {
	const { alias, classSlug } = await params;
	redirect(`/p/${alias}/c/${classSlug}/students`);
}
