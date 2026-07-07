import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import {
	IconCheckFilled,
	IconClockQuestion,
	IconFidgetSpinnerFilled,
} from "@tabler/icons-react";
import type { AttendanceSessionStatus } from "./types";

export function SessionStatusMedia({
	status,
	size = "lg",
}: {
	status: AttendanceSessionStatus;
	size?: "lg" | "sm";
}) {
	switch (status) {
		case "upcoming":
			return (
				<Avatar
					size={size}
					className="after:rounded-lg after:border-dashed after:border-muted-foreground/40"
				>
					<AvatarFallback className="rounded-lg bg-transparent" />
				</Avatar>
			);
		case "ongoing":
			return (
				<Avatar size={size} className="after:rounded-lg after:border-warning">
					<AvatarFallback className="rounded-lg bg-warning/10 text-warning">
						<IconFidgetSpinnerFilled className="animate-spin duration-1000" />
					</AvatarFallback>
				</Avatar>
			);
		case "completed":
			return (
				<Avatar
					size={size}
					className="after:rounded-lg after:border-success/40"
				>
					<AvatarFallback className="rounded-lg bg-success/10 text-success">
						<IconCheckFilled />
					</AvatarFallback>
				</Avatar>
			);
		case "missed":
			return (
				<Avatar
					size={size}
					className="after:rounded-lg after:border-destructive/40"
				>
					<AvatarFallback className="rounded-lg bg-destructive/10 text-destructive">
						<IconClockQuestion />
					</AvatarFallback>
				</Avatar>
			);
	}
}

export function RegisterSessionStatusBadge({
	status,
}: {
	status: AttendanceSessionStatus;
}) {
	switch (status) {
		case "upcoming":
			return <Badge variant="outline">Upcoming</Badge>;
		case "ongoing":
			return (
				<Badge variant="outline" className="gap-1">
					<IconFidgetSpinnerFilled className="size-3 animate-spin duration-1000" />
					Ongoing
				</Badge>
			);
		case "missed":
			return <Badge variant="destructive">Attendance missed</Badge>;
		case "completed":
			return <Badge variant="outline">Completed</Badge>;
	}
}

export function SessionStatusBadge({
	status,
}: {
	status: AttendanceSessionStatus;
}) {
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
