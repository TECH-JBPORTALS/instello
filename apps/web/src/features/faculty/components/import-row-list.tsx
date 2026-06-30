"use client";

import {
	IconAlertCircle,
	IconCircle,
	IconCircleCheck,
	IconCircleCheckFilled,
	IconCircleDashed,
	IconLoader2,
	IconX,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ImportRowStatus } from "@/lib/useCxImporter";
import { cn } from "@/lib/utils";

function RowStatusIcon({ status }: { status: ImportRowStatus }) {
	switch (status) {
		case "valid":
			return <IconCircleCheck className="size-4 text-primary" />;
		case "success":
			return <IconCircleCheckFilled className="size-4 text-success" />;
		case "skipped":
			return <IconCircleCheckFilled className="size-4 text-muted-foreground" />;
		case "invalid":
		case "error":
			return <IconX className="size-4 text-destructive" />;
		case "pending":
			return <IconCircleDashed className="size-4 text-muted-foreground" />;
		default:
			return <IconCircle className="size-4 text-muted-foreground" />;
	}
}

function statusLabel(status: ImportRowStatus) {
	switch (status) {
		case "validating":
			return "Verifying";
		case "valid":
			return "Valid";
		case "invalid":
			return "Invalid";
		case "uploading":
			return "Uploading";
		case "success":
			return "Imported";
		case "error":
			return "Failed";
		case "skipped":
			return "Already imported";
		default:
			return "Pending";
	}
}

type ImportRowListItem = {
	index: number;
	displayRow: number;
	data: {
		firstName: string;
		lastName: string;
		staffId: string;
		email: string;
	} | null;
	status: ImportRowStatus;
	errorMessage?: string;
};

type ImportRowListProps = {
	rows: ImportRowListItem[];
	activeRowIndex?: number | null;
	maxHeightClassName?: string;
};

export function ImportRowList({
	rows,
	activeRowIndex,
	maxHeightClassName = "max-h-64",
}: ImportRowListProps) {
	const rowRefs = useRef<Map<number, HTMLLIElement>>(new Map());

	const scrollTargetIndex =
		activeRowIndex ??
		rows.findIndex((row) => row.status === "invalid" || row.status === "error");

	useEffect(() => {
		if (scrollTargetIndex === null || scrollTargetIndex < 0) {
			return;
		}

		rowRefs.current
			.get(scrollTargetIndex)
			?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}, [scrollTargetIndex]);

	if (rows.length === 0) {
		return null;
	}

	return (
		<div
			className={cn(
				"overflow-y-auto rounded-lg border border-border",
				maxHeightClassName,
			)}
		>
			<ul className="divide-y divide-border">
				<AnimatePresence initial={false}>
					{rows.map((row) => {
						const isActive = activeRowIndex === row.index;
						const label = row.data
							? `${row.data.firstName} ${row.data.lastName}`
							: `Row ${row.displayRow}`;

						return (
							<motion.li
								key={row.index}
								ref={(element) => {
									if (element) {
										rowRefs.current.set(row.index, element);
										return;
									}

									rowRefs.current.delete(row.index);
								}}
								layout
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								className={cn(
									"flex items-start gap-3 px-3 py-2.5 text-sm",
									isActive && "bg-primary/5",
									row.status === "error" && "bg-destructive/5",
									row.status === "invalid" && "bg-destructive/5",
								)}
							>
								<div className="mt-0.5 shrink-0">
									{row.status === "validating" || row.status === "uploading" ? (
										<IconLoader2 className="size-4 animate-spin text-muted-foreground" />
									) : (
										<RowStatusIcon status={row.status} />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-2">
										<p className="truncate font-medium">{label}</p>
										<span className="shrink-0 text-xs text-muted-foreground">
											{statusLabel(row.status)}
										</span>
									</div>
									{row.data && (
										<p className="truncate text-xs text-muted-foreground">
											{row.data.staffId} · {row.data.email}
										</p>
									)}

									{row.errorMessage && (
										<p className="mt-1 flex items-start gap-1 text-xs text-destructive">
											<IconAlertCircle className="mt-0.5 size-3 shrink-0" />
											<span>{row.errorMessage}</span>
										</p>
									)}
								</div>
							</motion.li>
						);
					})}
				</AnimatePresence>
			</ul>
		</div>
	);
}
