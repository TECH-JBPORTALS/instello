"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@instello/ui/components/table";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type OnChangeFn,
	type RowSelectionState,
	useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
	columns: ColumnDef<TData>[];
	data: TData[];
	getRowId?: (row: TData) => string;
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: OnChangeFn<RowSelectionState>;
	rowClassName?: (row: TData) => string | undefined;
	className?: string;
};

/** Generic table renderer built on TanStack Table. Columns own their own cell/header rendering. */
export function DataTable<TData>({
	columns,
	data,
	getRowId,
	rowSelection,
	onRowSelectionChange,
	rowClassName,
	className,
}: DataTableProps<TData>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId,
		enableRowSelection: true,
		onRowSelectionChange,
		state: {
			rowSelection,
		},
	});

	return (
		<Table className={className}>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id} className="hover:bg-transparent">
						{headerGroup.headers.map((header) => (
							<TableHead key={header.id} colSpan={header.colSpan}>
								{header.isPlaceholder
									? null
									: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows.map((row) => (
					<TableRow
						key={row.id}
						data-state={row.getIsSelected() ? "selected" : undefined}
						className={cn(rowClassName?.(row.original))}
					>
						{row.getVisibleCells().map((cell) => (
							<TableCell key={cell.id}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
