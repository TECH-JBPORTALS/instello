import { AttendancePage } from "@/features/attendance/pages/attendance-page";

export default async function Page({
	params,
}: {
	params: Promise<{ alias: string; classSlug: string }>;
}) {
	const { alias, classSlug } = await params;

	return <AttendancePage classSlug={classSlug} programAlias={alias} />;
}
