"use client";

import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Checkbox } from "@instello/ui/components/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { getStudentDisplayName } from "../forms/shared-form";
import { StudentAvatar } from "./student-avatar";

export type StudentSummary = {
	_id: Id<"students">;
	firstName: string;
	lastName: string;
	usn: string;
	email: string;
	image?: string;
	batchId?: Id<"classBatches">;
	batchLabel?: string;
	categoryName: string;
};

type StudentColumnsOptions = {
	selectable: boolean;
	showBatchBadge: boolean;
	getHref: (studentId: Id<"students">) => string;
};

/** Builds the column definitions shared by the flat and batched student tables. */
export function createStudentColumns({
	selectable,
	showBatchBadge,
	getHref,
}: StudentColumnsOptions): ColumnDef<StudentSummary>[] {
	const columns: ColumnDef<StudentSummary>[] = [];

	if (selectable) {
		columns.push({
			id: "select",
			header: ({ table }) => (
				<div className="w-4">
					<Checkbox
						checked={table.getIsAllRowsSelected()}
						indeterminate={
							table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
						}
						disabled={table.getRowModel().rows.length === 0}
						onCheckedChange={(checked) =>
							table.toggleAllRowsSelected(!!checked)
						}
						aria-label="Select all students"
					/>
				</div>
			),
			cell: ({ row }) => (
				<div className="w-4">
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(checked) => row.toggleSelected(!!checked)}
						aria-label={`Select ${getStudentDisplayName(row.original.firstName, row.original.lastName)}`}
					/>
				</div>
			),
			size: 32,
			enableSorting: false,
		});
	}

	columns.push({
		id: "student",
		header: "Student",
		cell: ({ row }) => {
			const student = row.original;
			const displayName = getStudentDisplayName(
				student.firstName,
				student.lastName,
			);

			return (
				<Link
					href={getHref(student._id)}
					className="flex items-center gap-3 py-1"
				>
					<StudentAvatar
						firstName={student.firstName}
						lastName={student.lastName}
						image={student.image}
					/>
					<div className="flex min-w-0 flex-col">
						<span className="truncate font-medium text-foreground">
							{displayName}
						</span>
						<span className="truncate text-xs text-muted-foreground">
							{student.usn} · {student.email}
						</span>
					</div>
				</Link>
			);
		},
	});

	if (showBatchBadge) {
		columns.push({
			id: "batch",
			header: "Batch",
			cell: ({ row }) =>
				row.original.batchLabel ? (
					<Badge variant="outline">{row.original.batchLabel}</Badge>
				) : null,
			size: 96,
		});
	}

	columns.push({
		id: "category",
		header: "Category",
		cell: ({ row }) => (
			<Badge variant="secondary">{row.original.categoryName}</Badge>
		),
		size: 128,
	});

	return columns;
}
