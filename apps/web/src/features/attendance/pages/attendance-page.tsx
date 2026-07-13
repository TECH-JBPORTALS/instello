import Container from "@/components/common/container";
import { AttendancePageHeader } from "../components/attendance-page-header";

interface AttendancePageProps {
	classSlug: string;
	programAlias: string;
}

/**
 * **Class level attendance view**
 *
 * This page displays list of attendance registers for class
 * with search functionality to filter registers by subject name or code
 *  */
export function AttendancePage(_props: AttendancePageProps) {
	return (
		<Container>
			<AttendancePageHeader />
			<AttendanceRegistersList />
		</Container>
	);
}

function AttendanceRegistersList() {
	return <div>Here goes the registers...</div>;
}
