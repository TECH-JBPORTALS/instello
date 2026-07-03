"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import { cn } from "@instello/ui/lib/utils";
import {
	IconArrowRight,
	IconHistory,
	IconTag,
	IconUser,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export interface TimetablePublisher {
	name: string;
	image?: string;
}

export interface TimetablePublishInfoProps {
	publisher: TimetablePublisher;
	message: string;
	publishedAt: number;
	currentVersion: number;
	totalVersions: number;
	historyHref?: string;
	isLatest?: boolean;
	latestHref?: string;
}

export function TimetablePublishInfo({
	publisher,
	message,
	publishedAt,
	currentVersion,
	totalVersions,
	historyHref,
	isLatest = true,
	latestHref,
}: TimetablePublishInfoProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3",
				!isLatest &&
					"border-amber-500/40 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10",
			)}
		>
			<div className="flex min-w-0 items-center gap-3">
				<Badge variant="outline" className="gap-1">
					<IconTag className="size-3" />v{currentVersion}
				</Badge>
				<Avatar size="sm" className={"after:border-primary! after:border-2!"}>
					{publisher.image ? (
						<AvatarImage src={publisher.image} alt={publisher.name} />
					) : null}
					<AvatarFallback>
						<IconUser className="size-3.5" />
					</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 items-baseline gap-1.5 text-sm">
					<span className="shrink-0 font-medium text-foreground">
						{publisher.name}
					</span>
					<span className="truncate text-muted-foreground">{message}</span>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-3">
				<span className="text-xs text-muted-foreground">
					Published {formatDistanceToNow(publishedAt, { addSuffix: true })}
				</span>
				{!isLatest && latestHref ? (
					<Button
						nativeButton={false}
						variant="outline"
						size="sm"
						className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
						render={<Link href={latestHref} />}
					>
						<IconArrowRight />
						Go to latest version
					</Button>
				) : null}
				{historyHref ? (
					<Button
						nativeButton={false}
						variant="outline"
						size="sm"
						render={<Link href={historyHref} />}
					>
						<IconHistory />
						{totalVersions} versions
					</Button>
				) : (
					<Button type="button" variant="outline" size="sm">
						<IconHistory />
						{totalVersions} versions
					</Button>
				)}
			</div>
		</div>
	);
}
