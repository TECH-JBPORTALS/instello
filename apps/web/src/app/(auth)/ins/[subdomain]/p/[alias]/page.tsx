import { redirect } from "next/navigation";

export default async function ProgramPage({
	params,
}: {
	params: Promise<{ alias: string }>;
}) {
	const { alias } = await params;
	redirect(`/p/${alias}/classes`);
}
