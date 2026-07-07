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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@instello/ui/components/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@instello/ui/components/tabs";
import {
	IconCalendar,
	IconCheckFilled,
	IconChevronLeft,
	IconClipboardCheck,
	IconClock,
	IconClockQuestion,
	IconDots,
	IconFidgetSpinnerFilled,
	IconHistory,
	IconInfoCircle,
	IconUser,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import Container from "@/components/common/container";
import { useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { classPath } from "@/lib/class-path";
import { getAttendanceTimeContext } from "./attendance-time";
import { MarkAttendanceSheet } from "./mark-attendance-sheet";
import type { AttendanceSessionDto, AttendanceSessionStatus } from "./types";

interface SessionAction {
	label: string;
	icon: typeof IconInfoCircle;
	onClick?: () => void;
	withSeparator?: boolean;
}

function getSessionActions(
	status: AttendanceSessionStatus,
	onMarkAttendance: () => void,
): SessionAction[] {
	if (status === "completed") {
		return [
			{ label: "Attendance", icon: IconClipboardCheck },
			{ label: "Activity log", icon: IconHistory },
		];
	}

	const actions: SessionAction[] = [
		{ label: "Session details", icon: IconInfoCircle },
		{ label: "Staff details", icon: IconUser },
	];

	if (status === "ongoing") {
		return [
			{
				label: "Mark attendance",
				icon: IconClipboardCheck,
				onClick: onMarkAttendance,
				withSeparator: true,
			},
			...actions,
		];
	}

	return actions;
}

function SessionMedia({ status }: { status: AttendanceSessionStatus }) {
	switch (status) {
		case "upcoming":
			return (
				<Avatar
					size="lg"
					className="after:rounded-lg after:border-dashed after:border-muted-foreground/40"
				>
					<AvatarFallback className="rounded-lg bg-transparent" />
				</Avatar>
			);
		case "ongoing":
			return (
				<Avatar size="lg" className="after:rounded-lg after:border-warning">
					<AvatarFallback className="rounded-lg bg-warning/10 text-warning">
						<IconFidgetSpinnerFilled className="animate-spin duration-1000" />
					</AvatarFallback>
				</Avatar>
			);
		case "completed":
			return (
				<Avatar size="lg" className="after:rounded-lg after:border-success/40">
					<AvatarFallback className="rounded-lg bg-success/10 text-success">
						<IconCheckFilled />
					</AvatarFallback>
				</Avatar>
			);
		case "missed":
			return (
				<Avatar
					size="lg"
					className="after:rounded-lg after:border-destructive/40"
				>
					<AvatarFallback className="rounded-lg bg-destructive/10 text-destructive">
						<IconClockQuestion />
					</AvatarFallback>
				</Avatar>
			);
	}
}

function SessionStatusBadge({ status }: { status: AttendanceSessionStatus }) {
	switch (status) {
		case "upcoming":
			return <Badge variant="outline">Upcoming class</Badge>;
		case "ongoing":
			return <Badge variant="outline">Ongoing</Badge>;
		case "missed":
			return <Badge variant="destructive">Attendance missed</Badge>;
		case "completed":
			return null;
	}
}

function SessionItem({
	session,
	onMarkAttendance,
}: {
	session: AttendanceSessionDto;
	onMarkAttendance: (session: AttendanceSessionDto) => void;
}) {
	const isOngoing = session.status === "ongoing";
	const actions = getSessionActions(session.status, () =>
		onMarkAttendance(session),
	);

	return (
		<Item className="border-x-0 border-t-0 last:border-b-0 relative rounded-none border-border!">
			<ItemMedia variant="icon">
				<SessionMedia status={session.status} />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>
					{session.hourLabel}
					<Badge variant="outline" className="gap-1">
						<IconClock className="size-3" />
						{session.timeRange}
					</Badge>
					{session.inGracePeriod ? (
						<Badge variant="destructive">Mark attendance</Badge>
					) : null}
					<SessionStatusBadge status={session.status} />
				</ItemTitle>
				<div className="flex items-center gap-1.5">
					<Avatar size="xs">
						{session.actor.image ? (
							<AvatarImage src={session.actor.image} alt={session.actor.name} />
						) : null}
						<AvatarFallback>
							<IconUser className="size-3" />
						</AvatarFallback>
					</Avatar>
					<strong className="text-xs text-muted-foreground">
						{session.actor.name}
					</strong>
					<ItemDescription className="truncate text-muted-foreground">
						{session.description}
					</ItemDescription>
					{session.stats ? (
						<Badge variant="outline" className="shrink-0">
							{session.stats}
						</Badge>
					) : null}
				</div>
			</ItemContent>
			{isOngoing ? (
				<Button
					variant="outline"
					size="sm"
					onClick={() => onMarkAttendance(session)}
				>
					<IconClipboardCheck />
					Mark attendance
				</Button>
			) : null}
			<ItemActions>
				{session.updatedAt ? (
					<span className="text-xs text-muted-foreground">
						last updated{" "}
						{formatDistanceToNow(session.updatedAt, { addSuffix: true })}
					</span>
				) : null}
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<Button variant="outline" size="icon-sm" />}
					>
						<IconDots />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className={"min-w-fit"}>
						{actions.map((action) => (
							<Fragment key={action.label}>
								<DropdownMenuItem onClick={action.onClick}>
									<action.icon className="size-4" />
									{action.label}
								</DropdownMenuItem>
								{action.withSeparator ? <DropdownMenuSeparator /> : null}
							</Fragment>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</ItemActions>
		</Item>
	);
}

export function AttendanceRegisterView() {
	const params = useParams<{ registerId?: string }>();
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const registersPath = classPath(programAlias, classSlug, "attendance");
	const registerId = params.registerId as Id<"attendanceRegisters"> | undefined;

	const timeContext = useMemo(() => getAttendanceTimeContext(), []);

	const register = useInsQuery(
		api.attendance.getRegister,
		registerId ? { registerId } : "skip",
	);
	const sessionGroups = useInsQuery(
		api.attendance.listSessions,
		registerId
			? {
					registerId,
					...timeContext,
					daysBack: 14,
				}
			: "skip",
	);

	const [markAttendanceSession, setMarkAttendanceSession] =
		useState<AttendanceSessionDto | null>(null);

	const title = register
		? `${register.subjectName}${
				register.type === "practical" && register.batchLabel
					? ` (${register.batchLabel})`
					: ""
			} - Attendance`
		: "Attendance";

	return (
		<Container className="flex min-h-0 flex-1 flex-col">
			<div className="flex h-8 items-center">
				<Button
					nativeButton={false}
					variant="ghost"
					size="sm"
					className="-ml-2 h-8 rounded-full px-2 text-muted-foreground"
					render={<Link href={registersPath} />}
				>
					<IconChevronLeft className="size-4" />
					Registers
				</Button>
			</div>

			<Tabs defaultValue="daily" className="flex min-h-0 flex-1 flex-col gap-4">
				<div className="flex items-center justify-between gap-4">
					<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
					<TabsList>
						<TabsTrigger value="daily">Daily</TabsTrigger>
						<TabsTrigger value="monthly">Monthly</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="daily" className="space-y-6">
					{sessionGroups === undefined ? (
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, index) => (
								<Skeleton key={index} className="h-24 w-full rounded-lg" />
							))}
						</div>
					) : sessionGroups.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<IconCalendar />
								</EmptyMedia>
								<EmptyTitle>No sessions scheduled</EmptyTitle>
								<EmptyDescription>
									This register has no timetable sessions in the selected range.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						sessionGroups.map((group) => (
							<div key={group.id}>
								<h3 className="mb-2 text-sm font-medium text-muted-foreground">
									{group.label}
								</h3>
								<ItemGroup className="bg-card" variant="stack">
									{group.sessions.map((session) => (
										<SessionItem
											key={session.sessionKey}
											session={session}
											onMarkAttendance={setMarkAttendanceSession}
										/>
									))}
								</ItemGroup>
							</div>
						))
					)}
				</TabsContent>

				<TabsContent value="monthly">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<IconCalendar />
							</EmptyMedia>
							<EmptyTitle>Monthly view coming soon</EmptyTitle>
							<EmptyDescription>
								Switch to Daily to see today&apos;s sessions and recent
								activity.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</TabsContent>
			</Tabs>

			<MarkAttendanceSheet
				register={register ?? null}
				session={markAttendanceSession}
				open={markAttendanceSession !== null}
				onOpenChange={(open) => {
					if (!open) setMarkAttendanceSession(null);
				}}
			/>
		</Container>
	);
}
