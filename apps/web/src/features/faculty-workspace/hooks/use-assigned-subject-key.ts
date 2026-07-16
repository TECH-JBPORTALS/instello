"use client";

import { useParams } from "next/navigation";
import {
	type AssignedSubjectKeyParts,
	parseAssignedSubjectKey,
} from "../assigned-subject-key";

/** Reads and parses the `/assigned/[key]` route param */
export function useAssignedSubjectKey(): AssignedSubjectKeyParts | null {
	const params = useParams<{ key?: string }>();
	const key = typeof params.key === "string" ? params.key : null;
	if (!key) return null;
	return parseAssignedSubjectKey(decodeURIComponent(key));
}
