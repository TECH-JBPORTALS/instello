"use client";

import { Badge } from "@instello/ui/components/badge";
import { IconLock } from "@tabler/icons-react";
import { TEMPLATE_KEY_LABELS, type TemplateKey } from "../constants";

export function TemplateBadge({ templateKey }: { templateKey?: TemplateKey }) {
	if (!templateKey) return null;

	return <Badge variant="secondary">{TEMPLATE_KEY_LABELS[templateKey]}</Badge>;
}

export function LockBadge({ locked }: { locked: boolean }) {
	if (!locked) return null;

	return (
		<Badge variant="outline" className="gap-1">
			<IconLock className="size-3" />
			Locked
		</Badge>
	);
}
