export type FeaturePreviewScope = "program" | "class";

export type FeaturePreviewKey = "timetable" | "attendance";

export type FeaturePreviewSlide = {
	image: string;
	title: string;
	description: string;
};

export type FeaturePreviewConfig = {
	slides: FeaturePreviewSlide[];
};

const timetableProgramSlides: FeaturePreviewSlide[] = [
	{
		image: "/feat/timetable/1.png",
		title: "Program-wide timetable view",
		description:
			"See every class schedule in your program at a glance. Compare periods, spot gaps, and keep timetables aligned across sections.",
	},
	{
		image: "/feat/timetable/2.png",
		title: "Manage schedules for all classes",
		description:
			"Create and update timetables for each class from one place. Changes stay consistent across your program.",
	},
];

const timetableClassSlides: FeaturePreviewSlide[] = [
	{
		image: "/feat/timetable/1.png",
		title: "Weekly class schedule",
		description:
			"View this class's full weekly timetable with subjects, periods, and room assignments in one clear layout.",
	},
	{
		image: "/feat/timetable/2.png",
		title: "Edit this class's timetable",
		description:
			"Build and adjust periods for this class only. Assign subjects and faculty without affecting other classes.",
	},
];

const attendanceProgramSlides: FeaturePreviewSlide[] = [
	{
		image: "/feat/attendance/1.png",
		title: "Attendance registers for all classes",
		description:
			"Track daily attendance across every class in your program. Review registers, spot trends, and export summaries from one dashboard.",
	},
	{
		image: "/feat/attendance/2.png",
		title: "Session timeline by class",
		description:
			"See upcoming, ongoing, and completed sessions across your program. Spot missed attendance and review submission status at a glance.",
	},
	{
		image: "/feat/attendance/3.png",
		title: "Mark and review attendance",
		description:
			"Open any session to mark students present or absent. Filter by status and search the register without leaving the page.",
	},
	{
		image: "/feat/attendance/4.png",
		title: "Session details at a glance",
		description:
			"View date, hours, faculty, deadlines, and completion status for every session. Know what was submitted and what still needs attention.",
	},
];

const attendanceClassSlides: FeaturePreviewSlide[] = [
	{
		image: "/feat/attendance/1.png",
		title: "Daily attendance register",
		description:
			"Mark and review attendance for this class only. See who was present, absent, or late for each session.",
	},
	{
		image: "/feat/attendance/2.png",
		title: "Daily session timeline",
		description:
			"Follow this class's sessions by day—upcoming hours, ongoing classes, completed registers, and missed attendance in one list.",
	},
	{
		image: "/feat/attendance/3.png",
		title: "Mark this class's attendance",
		description:
			"Mark each student present or absent for a session. Search the list and filter to absentees quickly.",
	},
	{
		image: "/feat/attendance/4.png",
		title: "Session information",
		description:
			"Check the date, time slot, assigned faculty, submission deadline, and completion status for any session in this class.",
	},
];

const featurePreviews: Record<
	FeaturePreviewKey,
	Record<FeaturePreviewScope, FeaturePreviewConfig>
> = {
	timetable: {
		program: { slides: timetableProgramSlides },
		class: { slides: timetableClassSlides },
	},
	attendance: {
		program: { slides: attendanceProgramSlides },
		class: { slides: attendanceClassSlides },
	},
};

export function getFeaturePreview(
	key: FeaturePreviewKey,
	scope: FeaturePreviewScope,
): FeaturePreviewConfig {
	return featurePreviews[key][scope];
}

export function getFeaturePreviewTitle(key: FeaturePreviewKey): string {
	switch (key) {
		case "timetable":
			return "Timetables";
		case "attendance":
			return "Attendance";
	}
}

export function getFeaturePreviewEmptyDescription(
	key: FeaturePreviewKey,
	scope: FeaturePreviewScope,
): string {
	if (key === "timetable") {
		return scope === "program"
			? "Timetables for all classes in this program are on the way. You'll be able to view and manage every class schedule from here."
			: "This class timetable is on the way. You'll be able to view and manage the weekly schedule for this class from here.";
	}

	return scope === "program"
		? "Attendance registers for all classes in this program are on the way. You'll be able to track and review registers from here."
		: "This class attendance register is on the way. You'll be able to mark and review daily attendance from here.";
}
