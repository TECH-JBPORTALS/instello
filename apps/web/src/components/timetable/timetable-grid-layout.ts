import {
	formatLunchTimeRange,
	formatPeriodTimeRange,
	hasLunchBreak,
	lunchAfterPeriod,
	periodToColumnIndex,
	type TimetableSessionConfig,
	totalGridColumns,
} from "@instello/convex/schedule";

export type TimetableGridColumn =
	| { kind: "period"; index: number }
	| { kind: "lunch" };

export function buildGridColumns(
	config: TimetableSessionConfig,
): TimetableGridColumn[] {
	const columns: TimetableGridColumn[] = [];
	const lunchPeriod = lunchAfterPeriod(config);

	for (let index = 0; index < config.totalHours; index++) {
		columns.push({ kind: "period", index });
		if (lunchPeriod !== undefined && index + 1 === lunchPeriod) {
			columns.push({ kind: "lunch" });
		}
	}

	return columns;
}

export function getSpanColumnStyle(args: {
	config: TimetableSessionConfig;
	start: number;
	end: number;
}): { left: string; width: string } {
	const lunchPeriod = lunchAfterPeriod(args.config);
	const totalColumns = totalGridColumns(
		args.config.totalHours,
		hasLunchBreak(args.config),
	);
	const startColumn = periodToColumnIndex(args.start, lunchPeriod);
	const endColumn = periodToColumnIndex(args.end - 1, lunchPeriod) + 1;

	return {
		left: `${(startColumn / totalColumns) * 100}%`,
		width: `${((endColumn - startColumn) / totalColumns) * 100}%`,
	};
}

export function getHourColumnStyle(args: {
	config: TimetableSessionConfig;
	hour: number;
}): { left: string; width: string } {
	const lunchPeriod = lunchAfterPeriod(args.config);
	const totalColumns = totalGridColumns(
		args.config.totalHours,
		hasLunchBreak(args.config),
	);
	const column = periodToColumnIndex(args.hour, lunchPeriod);

	return {
		left: `${(column / totalColumns) * 100}%`,
		width: `${(1 / totalColumns) * 100}%`,
	};
}

export function getPeriodHeaderLabel(
	config: TimetableSessionConfig,
	index: number,
): string {
	return formatPeriodTimeRange(config, index, index + 1);
}

export function getLunchColumnStyle(
	config: TimetableSessionConfig,
): { left: string; width: string } | null {
	const lunchPeriod = lunchAfterPeriod(config);
	if (!lunchPeriod) {
		return null;
	}

	const totalColumns = totalGridColumns(
		config.totalHours,
		hasLunchBreak(config),
	);

	return {
		left: `${(lunchPeriod / totalColumns) * 100}%`,
		width: `${(1 / totalColumns) * 100}%`,
	};
}

export { formatLunchTimeRange };
