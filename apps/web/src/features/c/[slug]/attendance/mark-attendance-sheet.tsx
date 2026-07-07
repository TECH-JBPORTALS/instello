"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
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
import { Switch, SwitchThumb } from "@instello/ui/components/switch";
import { IconSearch, IconUsers } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import { useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { getStudentDisplayName } from "@/features/students/forms/shared-form";
import { StudentAvatar } from "@/features/students/student-avatar";
import { useInsMutation, useInsPaginatedQuery } from "@/hooks/convex-react";
import type { AttendanceRegisterDto, AttendanceSessionDto } from "./types";
import { getAttendanceTimeContext } from "./attendance-time";

const ATTENDANCE_ROSTER_PAGE_SIZE = 50;

function PresenceSwitch({
	present,
	onPresentChange,
}: {
	present: boolean;
	onPresentChange: (present: boolean) => void;
}) {
	return (
		<Switch
			checked={present}
			onCheckedChange={onPresentChange}
			className="h-6 w-11 bg-muted data-checked:bg-success/20! data-unchecked:bg-destructive/20!"
		>
			<SwitchThumb
				className={
					present
						? "size-5! translate-x-[calc(100%-2px)] bg-success/50! border-success!  font-bold text-success-foreground"
						: "size-5! translate-x-0 bg-destructive/50! border-destructive! font-bold text-destructive-foreground"
				}
			>
				{present ? "P" : "A"}
			</SwitchThumb>
		</Switch>
	);
}

export function MarkAttendanceSheet({
	register,
	session,
	open,
	onOpenChange,
}: {
	register: AttendanceRegisterDto | null;
	session: AttendanceSessionDto | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [presenceByStudentId, setPresenceByStudentId] = useState<
		Record<Id<"students">, boolean>
	>({});
	const [isSaving, setIsSaving] = useState(false);

	const markAttendance = useInsMutation(api.attendance.mark);

	const { results, status, loadMore, isLoading } = useInsPaginatedQuery(
		api.students.list,
		register
			? {
					classId: register.classId,
					batchId: register.batchId,
				}
			: "skip",
		{ initialNumItems: ATTENDANCE_ROSTER_PAGE_SIZE },
	);

	useEffect(() => {
		if (!open || status !== "CanLoadMore") return;
		loadMore(ATTENDANCE_ROSTER_PAGE_SIZE);
	}, [loadMore, open, status]);

	const query = searchQuery.trim().toLowerCase();
	const students = useMemo(() => {
		if (!results) return [];
		if (!query) return results;

		return results.filter((student) => {
			const fullName = getStudentDisplayName(
				student.firstName,
				student.lastName,
			).toLowerCase();
			return (
				fullName.includes(query) || student.usn.toLowerCase().includes(query)
			);
		});
	}, [results, query]);

	function isPresent(studentId: Id<"students">) {
		return presenceByStudentId[studentId] ?? true;
	}

	function setPresent(studentId: Id<"students">, present: boolean) {
		setPresenceByStudentId((prev) => ({ ...prev, [studentId]: present }));
	}

	async function handleSave() {
		if (!register || !session || !results || results.length === 0) {
			onOpenChange(false);
			return;
		}

		if (status === "CanLoadMore") {
			return;
		}

		setIsSaving(true);
		try {
			await markAttendance({
				registerId: register._id,
				sessionDate: session.sessionDate,
				day: session.day,
				startHour: session.startHour,
				endHour: session.endHour,
				entries: results.map((student) => ({
					studentId: student._id,
					status: isPresent(student._id) ? "present" : "absent",
				})),
				...getAttendanceTimeContext(),
			});
			onOpenChange(false);
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
				<SheetHeader className="border-b">
					<SheetTitle>Mark Attendance</SheetTitle>
					{session ? (
						<SheetDescription>
							{session.hourLabel} · {session.timeRange}
						</SheetDescription>
					) : null}
				</SheetHeader>

				<div className="p-4">
					<InputGroup>
						<InputGroupAddon>
							<IconSearch />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Search..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</InputGroup>
				</div>

				<div className="flex items-center justify-between px-4 pb-2 text-xs font-medium text-muted-foreground">
					<span>Student ({students.length})</span>
					<span>Status</span>
				</div>

				<div
					id="mark-attendance-scroll"
					className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
				>
					{status === "LoadingFirstPage" ? (
						<div className="space-y-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className="h-12 w-full rounded-lg" />
							))}
						</div>
					) : isEmpty(students) ? (
						<Empty className="min-h-48 border border-dashed">
							<EmptyMedia variant="icon">
								<IconUsers />
							</EmptyMedia>
							<EmptyHeader>
								<EmptyTitle>No students found</EmptyTitle>
								<EmptyDescription>
									Try a different search term.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<InfiniteScroll
							dataLength={students.length}
							next={() => loadMore(ATTENDANCE_ROSTER_PAGE_SIZE)}
							hasMore={status === "CanLoadMore"}
							loader={<Skeleton className="h-12 w-full rounded-lg" />}
							scrollableTarget="mark-attendance-scroll"
						>
							<ItemGroup className="bg-card">
								{students.map((student) => (
									<Item
										key={student._id}
										className="border-x-0 border-t-0 last:border-b-0 rounded-none border-border!"
									>
										<ItemMedia>
											<StudentAvatar
												firstName={student.firstName}
												lastName={student.lastName}
												image={student.image}
												size="sm"
											/>
										</ItemMedia>
										<ItemContent>
											<ItemTitle>
												{getStudentDisplayName(
													student.firstName,
													student.lastName,
												)}
											</ItemTitle>
											<ItemDescription>{student.usn}</ItemDescription>
										</ItemContent>
										<PresenceSwitch
											present={isPresent(student._id)}
											onPresentChange={(present) =>
												setPresent(student._id, present)
											}
										/>
									</Item>
								))}
							</ItemGroup>
							{isLoading ? (
								<Skeleton className="mt-3 h-12 w-full rounded-lg" />
							) : null}
						</InfiniteScroll>
					)}
				</div>

				<SheetFooter className="border-t">
					<Button
						onClick={handleSave}
						disabled={isSaving || !session || status === "CanLoadMore"}
					>
						{isSaving
							? "Saving..."
							: status === "CanLoadMore"
								? "Loading students..."
								: "Save attendance"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
