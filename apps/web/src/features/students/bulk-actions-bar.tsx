"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@instello/ui/components/command";
import { Kbd } from "@instello/ui/components/kbd";
import { IconArrowUpRight, IconGitBranch } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { ConfirmBulkActionDialog } from "./dialogs/confirm-bulk-action-dialog";

export type SelectedStudent = {
	_id: Id<"students">;
	firstName: string;
	lastName: string;
	image?: string;
	batchId?: Id<"classBatches">;
};

type PendingAction =
	| { type: "split" }
	| {
			type: "move";
			targetClassId: Id<"classes">;
			targetBatchId?: Id<"classBatches">;
			label: string;
	  };

type BulkActionsBarProps = {
	classId: Id<"classes">;
	isGroupsEnabled: boolean;
	selectedStudents: SelectedStudent[];
	onCancel: () => void;
	onActionComplete: () => void;
};

export function BulkActionsBar({
	classId,
	isGroupsEnabled,
	selectedStudents,
	onCancel,
	onActionComplete,
}: BulkActionsBarProps) {
	const [commandOpen, setCommandOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(
		null,
	);

	const moveTargets = useInsQuery(
		api.classBatches.listMoveTargets,
		commandOpen ? { classId } : "skip",
	);

	const splitIntoNewBatch = useInsMutation(api.classBatches.splitIntoNewBatch);
	const bulkMove = useInsMutation(api.students.bulkMove);

	const selectedCount = selectedStudents.length;

	const moveActionTargets = useMemo(() => {
		if (!moveTargets) return [];

		// Hide targets that would be a no-op: every selected student already
		// sits in that exact class + batch (only possible for the current class,
		// since selection is always scoped to a single class).
		return moveTargets.filter((target) => {
			if (!target.isCurrentClass) return true;
			return !selectedStudents.every(
				(student) => student.batchId === target.batchId,
			);
		});
	}, [moveTargets, selectedStudents]);

	const handleKeyDown = useCallback((ev: KeyboardEvent) => {
		if (ev.key === "k" && (ev.metaKey || ev.ctrlKey)) {
			setCommandOpen(true);
		}
	}, []);

	useEffect(() => {
		if (!commandOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => {
				document.removeEventListener("keydown", handleKeyDown);
			};
		}
	}, [commandOpen, handleKeyDown]);

	if (selectedCount === 0) return null;

	function selectAction(action: PendingAction) {
		setCommandOpen(false);
		setPendingAction(action);
	}

	async function handleConfirm() {
		if (!pendingAction) return;

		if (pendingAction.type === "split") {
			await splitIntoNewBatch({
				classId,
				studentIds: selectedStudents.map((student) => student._id),
			});
		} else {
			await bulkMove({
				studentIds: selectedStudents.map((student) => student._id),
				targetClassId: pendingAction.targetClassId,
				targetBatchId: pendingAction.targetBatchId,
			});
		}

		onActionComplete();
	}

	return (
		<>
			<div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
				<div className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-popover px-4 py-2.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
					<span className="text-sm font-medium">
						{selectedCount} student{selectedCount === 1 ? "" : "s"} selected
					</span>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={onCancel}>
							Cancel
						</Button>
						<Button size="sm" onClick={() => setCommandOpen(true)}>
							Actions{" "}
							<Kbd className="bg-primary-foreground/20 scale-80 text-xs text-primary-foreground/50">
								⌘K
							</Kbd>
						</Button>
					</div>
				</div>
			</div>

			<CommandDialog
				open={commandOpen}
				onOpenChange={setCommandOpen}
				title="Bulk actions"
				description="Choose an action to apply to the selected students."
				className="min-w-lg max-w-min"
			>
				<Command>
					<div className="flex items-center justify-between py-2">
						<Badge variant="secondary">
							{selectedCount} Student{selectedCount === 1 ? "" : "s"}
						</Badge>

						<Kbd>ESC</Kbd>
					</div>
					<CommandInput placeholder="Search actions..." />
					<CommandList>
						<CommandEmpty>No matching actions.</CommandEmpty>

						{isGroupsEnabled && (
							<CommandGroup heading="SPLIT">
								<CommandItem onSelect={() => selectAction({ type: "split" })}>
									<IconGitBranch /> Split into new batch
								</CommandItem>
							</CommandGroup>
						)}

						{moveActionTargets.length > 0 && (
							<CommandGroup heading="MOVE">
								{moveActionTargets.map((target) => {
									const label = target.isCurrentClass
										? (target.batchLabel ?? target.className)
										: target.batchId
											? `${target.className} → ${target.batchLabel}`
											: target.className;

									return (
										<CommandItem
											key={`${target.classId}-${target.batchId ?? "none"}`}
											onSelect={() =>
												selectAction({
													type: "move",
													targetClassId: target.classId,
													targetBatchId: target.batchId,
													label,
												})
											}
										>
											<IconArrowUpRight /> Move to {label}
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</CommandDialog>

			<ConfirmBulkActionDialog
				open={pendingAction !== null}
				onOpenChange={(open) => {
					if (!open) setPendingAction(null);
				}}
				title={
					pendingAction?.type === "split"
						? "Split into new batch"
						: "Move students"
				}
				description={
					pendingAction?.type === "split"
						? `A new sequence batch will be created and these ${selectedCount} student${selectedCount === 1 ? "" : "s"} will move into it.`
						: `Move ${selectedCount} student${selectedCount === 1 ? "" : "s"} to ${
								pendingAction?.type === "move" ? pendingAction.label : ""
							}.`
				}
				confirmLabel={pendingAction?.type === "split" ? "Split" : "Move"}
				students={selectedStudents}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
