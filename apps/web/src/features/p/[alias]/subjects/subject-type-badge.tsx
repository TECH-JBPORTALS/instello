"use client";

import { Badge } from "@instello/ui/components/badge";
import type { SubjectAllocationType } from "./constants";
import { SUBJECT_TYPE_ICONS, SUBJECT_TYPE_LABELS } from "./constants";

export function SubjectTypeBadge({ type }: { type: SubjectAllocationType }) {
	const Icon = SUBJECT_TYPE_ICONS[type];

	return (
		<Badge variant="outline" className="text-muted-foreground capitalize">
			<Icon /> {SUBJECT_TYPE_LABELS[type]}
		</Badge>
	);
}
