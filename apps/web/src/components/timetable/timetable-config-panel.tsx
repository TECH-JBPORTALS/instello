"use client";

import {
	DEFAULT_LUNCH_AFTER_PERIOD,
	formatTimeOfDay,
	validateSessionConfig,
} from "@instello/convex/schedule";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@instello/ui/components/command";
import { Field, FieldLabel } from "@instello/ui/components/field";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@instello/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Separator } from "@instello/ui/components/separator";
import { Switch } from "@instello/ui/components/switch";
import { cn } from "@instello/ui/lib/utils";
import { IconClock } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import {
	buildTimeOptions,
	canReduceTotalHours,
	MAX_TOTAL_HOURS,
	MIN_TOTAL_HOURS,
	moveLunchBreak,
	parseTimeString,
	resizeSessionConfig,
	toggleLunchBreak,
} from "@/components/timetable/timetable-config-utils";
import type { TimetableSessionConfig } from "@/components/timetable/types";

const TIME_OPTIONS = buildTimeOptions();

function TimeCombobox({
	value,
	onChange,
	"aria-label": ariaLabel,
	invalid,
	className,
}: {
	value: number;
	onChange: (timestamp: number) => void;
	"aria-label": string;
	invalid?: boolean;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const normalizedSearch = search.trim().toLowerCase();

	const filteredOptions = useMemo(() => {
		if (!normalizedSearch) {
			return TIME_OPTIONS;
		}
		const compact = normalizedSearch.replace(/\s+/g, "");
		return TIME_OPTIONS.filter((option) => {
			const label = formatTimeOfDay(option).toLowerCase();
			return (
				label.includes(normalizedSearch) ||
				label.replace(/\s+/g, "").includes(compact)
			);
		});
	}, [normalizedSearch]);

	const customTimestamp = useMemo(() => {
		const parsed = parseTimeString(search);
		if (parsed === null) {
			return null;
		}
		const alreadyListed = filteredOptions.some((option) => option === parsed);
		return alreadyListed ? null : parsed;
	}, [search, filteredOptions]);

	function commit(timestamp: number) {
		onChange(timestamp);
		setSearch("");
		setOpen(false);
	}

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) {
					setSearch("");
				}
			}}
		>
			<PopoverTrigger
				aria-label={ariaLabel}
				className={cn(
					"flex h-8 items-center justify-between gap-1 rounded-md border bg-background px-2 text-xs transition-colors outline-none hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
					invalid && "border-destructive",
					className,
				)}
			>
				<span className="truncate">{formatTimeOfDay(value)}</span>
				<IconClock className="size-3.5 shrink-0 text-muted-foreground" />
			</PopoverTrigger>
			<PopoverContent align="start" className="w-44 p-0">
				<Command shouldFilter={false}>
					<CommandInput
						autoFocus
						value={search}
						onValueChange={setSearch}
						placeholder="Type a time…"
					/>
					<CommandList>
						<CommandEmpty>No matching time</CommandEmpty>
						<CommandGroup>
							{customTimestamp !== null ? (
								<CommandItem
									value={`custom-${customTimestamp}`}
									onSelect={() => commit(customTimestamp)}
								>
									Use {formatTimeOfDay(customTimestamp)}
								</CommandItem>
							) : null}
							{filteredOptions.map((option) => (
								<CommandItem
									key={option}
									value={String(option)}
									data-checked={option === value}
									onSelect={() => commit(option)}
								>
									{formatTimeOfDay(option)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export function TimetableConfigPanel({
	config,
	spans,
	onChange,
}: {
	config: TimetableSessionConfig;
	spans: HourSpan[];
	onChange: (config: TimetableSessionConfig) => void;
}) {
	const validationErrors = useMemo(
		() => validateSessionConfig(config),
		[config],
	);
	const errorsByField = useMemo(
		() =>
			new Map(validationErrors.map((error) => [error.field, error.message])),
		[validationErrors],
	);

	const lunchAfterPeriod = Math.min(
		config.lunchBreak?.afterPeriod ?? DEFAULT_LUNCH_AFTER_PERIOD,
		config.totalHours - 1,
	);
	const lunchEnabled = config.lunchBreak?.enabled ?? false;

	function updatePeriod(
		index: number,
		patch: Partial<{ startTime: number; endTime: number }>,
	) {
		const periods = config.periods.map((period, periodIndex) =>
			periodIndex === index ? { ...period, ...patch } : period,
		);
		onChange({ ...config, periods });
	}

	function handleTotalHoursChange(value: string | null) {
		if (!value) {
			return;
		}

		const totalHours = Number(value);
		if (
			!Number.isInteger(totalHours) ||
			totalHours < MIN_TOTAL_HOURS ||
			totalHours > MAX_TOTAL_HOURS
		) {
			return;
		}

		if (!canReduceTotalHours(config, spans, totalHours)) {
			return;
		}

		onChange(resizeSessionConfig(config, totalHours));
	}

	function handleLunchToggle(enabled: boolean) {
		onChange(toggleLunchBreak(config, enabled));
	}

	function handleLunchMove(value: string | null) {
		if (!value) {
			return;
		}
		const afterPeriod = Number(value);
		if (!Number.isInteger(afterPeriod)) {
			return;
		}
		onChange(moveLunchBreak(config, afterPeriod));
	}

	function updateLunch(
		patch: Partial<{
			afterPeriod: number;
			startTime: number;
			endTime: number;
		}>,
	) {
		if (!config.lunchBreak?.enabled) {
			return;
		}

		onChange({
			...config,
			lunchBreak: {
				...config.lunchBreak,
				...patch,
			},
		});
	}

	const rows: Array<{ kind: "period"; index: number } | { kind: "lunch" }> = [];

	for (let index = 0; index < config.totalHours; index++) {
		rows.push({ kind: "period", index });
		if (index + 1 === lunchAfterPeriod) {
			rows.push({ kind: "lunch" });
		}
	}

	return (
		<div className="flex flex-col gap-4 overflow-y-auto p-3">
			<Field>
				<FieldLabel htmlFor="total-hours">Total hours</FieldLabel>
				<Select
					value={String(config.totalHours)}
					onValueChange={handleTotalHoursChange}
				>
					<SelectTrigger id="total-hours" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Array.from(
							{ length: MAX_TOTAL_HOURS - MIN_TOTAL_HOURS + 1 },
							(_, offset) => MIN_TOTAL_HOURS + offset,
						).map((hours) => (
							<SelectItem
								key={hours}
								value={String(hours)}
								disabled={!canReduceTotalHours(config, spans, hours)}
							>
								{hours} hours
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			<div className="flex flex-col gap-3">
				{rows.map((row) => {
					if (row.kind === "lunch") {
						return (
							<div
								key="lunch-break"
								className="rounded-md py-2 border border-dashed"
							>
								<div className="flex items-center justify-between gap-2 px-3 py-2">
									<p className="text-sm font-medium">Lunch break</p>
									<Switch
										checked={lunchEnabled}
										onCheckedChange={handleLunchToggle}
										aria-label="Toggle lunch break"
									/>
								</div>
								{lunchEnabled && config.lunchBreak ? (
									<div className="mt-2 flex flex-col gap-1.5">
										<Separator />
										<div className="flex  px-2.5 py-1 items-center justify-between gap-2">
											<span className="shrink-0 text-xs text-muted-foreground">
												After
											</span>
											<Select
												value={String(lunchAfterPeriod)}
												onValueChange={handleLunchMove}
											>
												<SelectTrigger
													size="sm"
													className="h-8 w-14"
													aria-label="Lunch position"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{Array.from(
														{ length: config.totalHours - 1 },
														(_, offset) => offset + 1,
													).map((period) => (
														<SelectItem key={period} value={String(period)}>
															H{period}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<Separator />
										<div className="flex items-center gap-2  px-2.5 py-1">
											<TimeCombobox
												className="flex-1"
												aria-label="Lunch start time"
												value={config.lunchBreak.startTime}
												invalid={errorsByField.has("lunchBreak")}
												onChange={(startTime) => updateLunch({ startTime })}
											/>
											<span className="text-muted-foreground">-</span>
											<TimeCombobox
												className="flex-1"
												aria-label="Lunch end time"
												value={config.lunchBreak.endTime}
												invalid={errorsByField.has("lunchBreak")}
												onChange={(endTime) => updateLunch({ endTime })}
											/>
										</div>
										{errorsByField.get("lunchBreak") ? (
											<p className="text-xs text-destructive">
												{errorsByField.get("lunchBreak")}
											</p>
										) : null}
									</div>
								) : null}
							</div>
						);
					}

					const period = config.periods[row.index];
					if (!period) {
						return null;
					}

					const fieldKey = `periods[${row.index}]`;
					const hasError = errorsByField.has(fieldKey);

					return (
						<div key={fieldKey} className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								<span className="w-7 shrink-0 text-sm font-medium">
									H{row.index + 1}
								</span>
								<TimeCombobox
									className="flex-1"
									aria-label={`H${row.index + 1} start time`}
									value={period.startTime}
									invalid={hasError}
									onChange={(startTime) =>
										updatePeriod(row.index, { startTime })
									}
								/>
								<span className="text-muted-foreground">-</span>
								<TimeCombobox
									className="flex-1"
									aria-label={`H${row.index + 1} end time`}
									value={period.endTime}
									invalid={hasError}
									onChange={(endTime) => updatePeriod(row.index, { endTime })}
								/>
							</div>
							{errorsByField.get(fieldKey) ? (
								<p className="pl-9 text-xs text-destructive">
									{errorsByField.get(fieldKey)}
								</p>
							) : null}
						</div>
					);
				})}
			</div>

			{validationErrors.length > 0 ? (
				<p className="text-xs text-destructive">
					Fix timing issues before saving.
				</p>
			) : null}
		</div>
	);
}
