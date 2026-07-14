"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@instello/ui/components/sheet";
import { Skeleton } from "@instello/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@instello/ui/components/tabs";
import {
	IconClipboardCheck,
	IconClock,
	IconHistory,
	IconUser,
	IconUsers,
} from "@tabler/icons-react";
import { format, formatDistanceToNow } from "date-fns";
import { isEmpty } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { getStudentDisplayName } from "@/features/students/forms/shared-form";
import { useInsQuery } from "@/hooks/convex-react";
import { getAttendanceTimeContext } from "./attendance-time";
import type {
	ActivityLogDto,
	AttendanceRegisterDto,
	AttendanceSessionDto,
	AttendanceSessionStatus,
} from "./types";

export type SessionDetailsTab = "details" | "activity";

function SessionStatusBadge({ status }: { status: AttendanceSessionStatus }) {
	switch (status) {
		case "upcoming":
			return <Badge variant="outline">Upcoming</Badge>;
		case "ongoing":
			return <Badge variant="outline">Ongoing</Badge>;
		case "missed":
			return <Badge variant="destructive">Missed</Badge>;
		case "completed":
			return <Badge variant="outline">Completed</Badge>;
	}
}

function formatChangeSummary(
	change: ActivityLogDto["changes"][number],
	studentNameById: Map<Id<"students">, string>,
): string {
	const name = studentNameById.get(change.studentId) ?? "Unknown student";
	const previous = change.previousStatus ?? "—";
	return `${name}: ${previous} → ${change.newStatus}`;
}

export function SessionDetailsSheet({
	register,
	session,
	open,
	onOpenChange,
	initialTab = "details",
	onMarkAttendance,
}: {
	register: AttendanceRegisterDto | null;
	session: AttendanceSessionDto | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialTab?: SessionDetailsTab;
	onMarkAttendance?: (session: AttendanceSessionDto) => void;
}) {
	const [tab, setTab] = useState<SessionDetailsTab>(initialTab);

	useEffect(() => {
		if (open) setTab(initialTab);
	}, [open, initialTab]);

	const timeContext = useMemo(() => getAttendanceTimeContext(), []);

	const details = useInsQuery(
		api.attendance.queries.getSessionDetails,
		register && session && open
			? {
					registerId: register._id,
					sessionDate: session.sessionDate,
					day: session.day,
					startHour: session.startHour,
					endHour: session.endHour,
					...timeContext,
				}
			: "skip",
	);

	const activityLog = useInsQuery(
		api.attendance.queries.listActivityLog,
		details?.recordId ? { recordId: details.recordId } : "skip",
	);

	const studentNameById = useMemo(() => {
		const map = new Map<Id<"students">, string>();
		for (const entry of details?.entries ?? []) {
			map.set(
				entry.studentId,
				getStudentDisplayName(entry.firstName, entry.lastName),
			);
		}
		return map;
	}, [details?.entries]);

	const isEdit = session?.status === "completed";
	const markLabel = isEdit ? "Edit attendance" : "Mark attendance";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
				<SheetHeader className="border-b">
					<SheetTitle>Session details</SheetTitle>
					{session ? (
						<SheetDescription>
							{session.hourLabel} · {session.timeRange}
						</SheetDescription>
					) : null}
				</SheetHeader>

				{details === undefined ? (
					<div className="space-y-3 p-4">
						<Skeleton className="h-16 w-full rounded-lg" />
						<Skeleton className="h-32 w-full rounded-lg" />
					</div>
				) : (
					<Tabs
						value={tab}
						onValueChange={(value) => setTab(value as SessionDetailsTab)}
						className="flex min-h-0 flex-1 flex-col"
					>
						<div className="border-b px-4 py-3">
							<TabsList className="w-full">
								<TabsTrigger value="details" className="flex-1">
									Details
								</TabsTrigger>
								<TabsTrigger
									value="activity"
									className="flex-1"
									disabled={!details.recordId}
								>
									Activity log
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent
							value="details"
							className="min-h-0 flex-1 overflow-y-auto p-4"
						>
							<div className="space-y-4">
								<div className="flex flex-wrap items-center gap-2">
									<SessionStatusBadge status={details.session.status} />
									{details.session.inGracePeriod ? (
										<Badge variant="destructive">Grace period</Badge>
									) : null}
									<Badge variant="outline" className="gap-1">
										<IconClock className="size-3" />
										{details.session.timeRange}
									</Badge>
									{details.stats ? (
										<Badge variant="outline">{details.stats}</Badge>
									) : null}
								</div>

								<div className="rounded-lg border bg-card p-3 text-sm">
									<p className="font-medium">{details.register.subjectName}</p>
									<p className="text-muted-foreground">
										{details.register.subjectCode}
										{details.register.batchLabel
											? ` · ${details.register.batchLabel}`
											: ""}
										{" · "}
										{details.register.type}
									</p>
									<p className="mt-1 text-muted-foreground">
										{details.session.description}
									</p>
									{details.session.actor ? (
										<div className="mt-2 flex items-center gap-1.5">
											<Avatar size="xs">
												{details.session.actor.image ? (
													<AvatarImage
														src={details.session.actor.image}
														alt={details.session.actor.name}
													/>
												) : null}
												<AvatarFallback>
													<IconUser className="size-3" />
												</AvatarFallback>
											</Avatar>
											<span className="text-xs text-muted-foreground">
												{details.session.actor.name}
											</span>
										</div>
									) : null}
								</div>

								<div>
									<h3 className="mb-2 text-sm font-medium">
										Students ({details.entries.length})
									</h3>
									{isEmpty(details.entries) ? (
										<Empty className="min-h-32 border border-dashed">
											<EmptyMedia variant="icon">
												<IconUsers />
											</EmptyMedia>
											<EmptyHeader>
												<EmptyTitle>No attendance recorded</EmptyTitle>
												<EmptyDescription>
													Mark attendance to see student statuses here.
												</EmptyDescription>
											</EmptyHeader>
										</Empty>
									) : (
										<ItemGroup className="bg-card" variant="stack">
											{details.entries.map((entry) => (
												<Item
													key={entry.studentId}
													className="border-x-0 border-t-0 last:border-b-0 rounded-none border-border!"
												>
													<ItemMedia>
														<Avatar size="sm">
															<AvatarFallback>
																{entry.firstName.charAt(0)}
																{entry.lastName.charAt(0)}
															</AvatarFallback>
														</Avatar>
													</ItemMedia>
													<ItemContent>
														<ItemTitle>
															{getStudentDisplayName(
																entry.firstName,
																entry.lastName,
															)}
														</ItemTitle>
														<ItemDescription>{entry.usn}</ItemDescription>
													</ItemContent>
													<Badge
														variant={
															entry.status === "present"
																? "outline"
																: "destructive"
														}
													>
														{entry.status}
													</Badge>
												</Item>
											))}
										</ItemGroup>
									)}
								</div>
							</div>
						</TabsContent>

						<TabsContent
							value="activity"
							className="min-h-0 flex-1 overflow-y-auto p-4"
						>
							{activityLog === undefined ? (
								<div className="space-y-3">
									{Array.from({ length: 3 }).map((_, index) => (
										<Skeleton key={index} className="h-20 w-full rounded-lg" />
									))}
								</div>
							) : isEmpty(activityLog) ? (
								<Empty className="min-h-32 border border-dashed">
									<EmptyMedia variant="icon">
										<IconHistory />
									</EmptyMedia>
									<EmptyHeader>
										<EmptyTitle>No activity yet</EmptyTitle>
										<EmptyDescription>
											Changes to attendance will appear here.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							) : (
								<div className="space-y-3">
									{activityLog.map((log) => (
										<div
											key={log._id}
											className="rounded-lg border bg-card p-3 text-sm"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex items-center gap-2">
													<Avatar size="xs">
														{log.performedBy.image ? (
															<AvatarImage
																src={log.performedBy.image}
																alt={log.performedBy.name}
															/>
														) : null}
														<AvatarFallback>
															<IconUser className="size-3" />
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">
															{log.performedBy.name}
														</p>
														<p className="text-xs text-muted-foreground">
															{log.action === "marked"
																? "Marked attendance"
																: "Updated attendance"}
														</p>
													</div>
												</div>
												<span className="shrink-0 text-xs text-muted-foreground">
													{formatDistanceToNow(log.performedAt, {
														addSuffix: true,
													})}
												</span>
											</div>
											<p className="mt-1 text-xs text-muted-foreground">
												{format(log.performedAt, "PPp")}
											</p>
											<ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
												{log.changes.slice(0, 5).map((change, index) => (
													<li key={`${log._id}-${change.studentId}-${index}`}>
														{formatChangeSummary(change, studentNameById)}
													</li>
												))}
												{log.changes.length > 5 ? (
													<li>
														+{log.changes.length - 5} more change
														{log.changes.length - 5 === 1 ? "" : "s"}
													</li>
												) : null}
											</ul>
										</div>
									))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				)}

				{details?.canMark && session && onMarkAttendance ? (
					<SheetFooter className="border-t">
						<Button
							className="w-full"
							onClick={() => {
								onOpenChange(false);
								onMarkAttendance(session);
							}}
						>
							<IconClipboardCheck />
							{markLabel}
						</Button>
					</SheetFooter>
				) : null}
			</SheetContent>
		</Sheet>
	);
}
