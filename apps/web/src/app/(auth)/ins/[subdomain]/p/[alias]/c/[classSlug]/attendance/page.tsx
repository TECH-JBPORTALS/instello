import { AttendancePage } from "@/features/c/[slug]/pages/class-section-pages";

export default async function Page(_props: {
	params: Promise<{ alias: string; classSlug: string }>;
}) {
	// const { alias, classSlug } = await params;

	return <AttendancePage />;
}
