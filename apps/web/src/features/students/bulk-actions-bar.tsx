"use client";

import { Button } from "@instello/ui/components/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandInput,
	CommandList,
} from "@instello/ui/components/command";
import { useState } from "react";

type BulkActionsBarProps = {
	selectedCount: number;
	onCancel: () => void;
};

export function BulkActionsBar({
	selectedCount,
	onCancel,
}: BulkActionsBarProps) {
	const [commandOpen, setCommandOpen] = useState(false);

	if (selectedCount === 0) return null;

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
							Actions
						</Button>
					</div>
				</div>
			</div>

			<CommandDialog
				open={commandOpen}
				onOpenChange={setCommandOpen}
				title="Bulk actions"
				description="Choose an action to apply to the selected students."
			>
				<CommandInput placeholder="Search actions..." />
				<CommandList>
					<CommandEmpty>No actions available yet.</CommandEmpty>
				</CommandList>
			</CommandDialog>
		</>
	);
}
