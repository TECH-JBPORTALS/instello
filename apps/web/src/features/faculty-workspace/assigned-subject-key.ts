const KEY_SEPARATOR = "--";

export type AssignedSubjectKeyParts = {
	programAlias: string;
	classSlug: string;
	subjectAlias: string;
};

/** Builds `/assigned/{programAlias}--{classSlug}--{subjectAlias}` key segment */
export function buildAssignedSubjectKey({
	programAlias,
	classSlug,
	subjectAlias,
}: AssignedSubjectKeyParts) {
	return [programAlias, classSlug, subjectAlias].join(KEY_SEPARATOR);
}

/** Parses a combined assigned-subject key into its three parts */
export function parseAssignedSubjectKey(
	key: string,
): AssignedSubjectKeyParts | null {
	const parts = key.split(KEY_SEPARATOR);
	if (parts.length !== 3) return null;

	const [programAlias, classSlug, subjectAlias] = parts;
	if (!programAlias || !classSlug || !subjectAlias) return null;

	return { programAlias, classSlug, subjectAlias };
}

export function assignedSubjectPath(parts: AssignedSubjectKeyParts) {
	return `/assigned/${buildAssignedSubjectKey(parts)}`;
}
