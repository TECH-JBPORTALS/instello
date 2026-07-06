"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { IconUser } from "@tabler/icons-react";

export interface TimetableTeacher {
	name: string;
	image?: string;
}

export interface TimetableItem {
	day: number;
	startHour: number;
	endHour: number;
	subject: string;
	room?: string;
	batch?: string;
	color: string;
	teacher?: TimetableTeacher;
}

const DAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

const CLASS_START_TIME = 9;
const CLASS_HOUR_DURATION_IN_HOUR = 1;

const slots = Array.from({ length: 7 }, (_, index) => index);

const emptyCellBackground = {
	backgroundImage: "radial-gradient(var(--color-border) 1px, transparent 1px)",
	backgroundSize: "12px 12px",
} as const;

function getDayName(day: number) {
	return DAYS[day];
}

function entryColorStyles(color: string) {
	return {
		backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
		borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
	} as const;
}

function TimetableEntry({ item }: { item: TimetableItem }) {
	return (
		<div
			className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-md border p-2"
			style={entryColorStyles(item.color)}
		>
			<span
				className="truncate text-xs font-semibold"
				style={{ color: item.color }}
			>
				{item.subject}
				{item.batch ? ` (${item.batch})` : ""}
				{item.room ? ` (${item.room})` : ""}
			</span>
			{item.teacher ? (
				<div className="flex items-center gap-1.5">
					<Avatar size="sm">
						{item.teacher.image ? (
							<AvatarImage src={item.teacher.image} alt={item.teacher.name} />
						) : null}
						<AvatarFallback>
							<IconUser className="size-3" />
						</AvatarFallback>
					</Avatar>
					<span className="truncate text-xs text-muted-foreground">
						{item.teacher.name}
					</span>
				</div>
			) : null}
		</div>
	);
}

function formatTime(hour: number) {
	return `${hour}:00`;
}

export function Timetable({ items }: { items: TimetableItem[] }) {
	return (
		<div className="flex flex-col border rounded-lg">
			<div className="flex flex-row [&>div]:border-r border-b [&>div]:last:border-r-0 h-14">
				<div className="min-w-max max-w-[120px] w-full px-4 flex flex-col items-center text-xs text-muted-foreground justify-center font-medium h-auto">
					Days
				</div>
				{slots.map((slot) => (
					<div
						key={slot}
						data-slot="hour-row"
						className="w-full flex flex-col gap-1 items-center justify-center font-medium h-auto"
					>
						<span className="text-xs font-medium">Hour {slot + 1}</span>
						<p className="text-xs text-muted-foreground">
							{formatTime(
								CLASS_START_TIME + slot * CLASS_HOUR_DURATION_IN_HOUR,
							)}{" "}
							-{" "}
							{formatTime(
								CLASS_START_TIME + (slot + 1) * CLASS_HOUR_DURATION_IN_HOUR,
							)}
						</p>
					</div>
				))}
			</div>
			<div className="flex flex-col **:data-[slot='day-row']:border-b **:data-[slot='day-row']:last:border-b-0">
				{DAYS.map((_, day) => {
					const consumedUntil = new Map<number, boolean>();

					return (
						<div
							data-slot="day-row"
							key={day}
							className="flex flex-row items-stretch"
						>
							<div className="w-[120px] border-r flex flex-col items-center justify-center px-4">
								<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									{getDayName(day)?.slice(0, 3)}
								</span>
							</div>
							<div className="flex flex-row px-1.5 gap-1.5 flex-1 last:border-r-0">
								{slots.map((slot) => {
									if (consumedUntil.get(slot)) return null;

									const cellItems = items.filter(
										(item) => item.day === day && item.startHour === slot,
									);

									if (cellItems.length === 0) {
										return (
											<div
												key={slot}
												className="min-h-16 flex-1 border-r last:border-r-0"
												style={emptyCellBackground}
											/>
										);
									}

									const span = Math.max(
										...cellItems.map((item) => item.endHour - item.startHour),
										1,
									);

									for (let offset = 1; offset < span; offset++) {
										consumedUntil.set(slot + offset, true);
									}

									return (
										<div
											key={slot}
											className="flex flex-col gap-1.5 py-1.5 last:border-r-0"
											style={{ flexGrow: span, flexBasis: 0 }}
										>
											{cellItems.map((item, index) => (
												<TimetableEntry
													key={`${item.subject}-${item.room ?? index}`}
													item={item}
												/>
											))}
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
