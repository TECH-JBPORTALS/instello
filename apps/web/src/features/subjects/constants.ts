export const SUBJECT_LIST_PAGE_SIZE = 20;

export const SUBJECT_COLOR_PALETTE = [
	{ value: "#22C55E", label: "Green" },
	{ value: "#3B82F6", label: "Blue" },
	{ value: "#A855F7", label: "Purple" },
	{ value: "#EC4899", label: "Pink" },
	{ value: "#14B8A6", label: "Teal" },
	{ value: "#EF4444", label: "Red" },
	{ value: "#F43F5E", label: "Rose" },
	{ value: "#06B6D4", label: "Cyan" },
	{ value: "#F59E0B", label: "Amber" },
] as const;

export function isPresetSubjectColor(color: string): boolean {
	return SUBJECT_COLOR_PALETTE.some(
		(option) => option.value.toLowerCase() === color.toLowerCase(),
	);
}

export function getSubjectInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);

	if (words.length === 0) return "?";

	const first = words[0]?.charAt(0) ?? "";
	if (words.length === 1) return first.toUpperCase();

	const second = words[1]?.charAt(0) ?? "";
	return `${first}${second}`.toUpperCase();
}

export function subjectColorStyles(color: string) {
	return {
		backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
		color,
	} as const;
}
