"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@instello/ui/components/dialog";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@instello/ui/components/item";
import { useState } from "react";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";

type DangerZoneSectionProps = {
	faculty: {
		_id: Id<"faculty">;
		firstName: string;
		lastName: string;
		status: "active" | "inactive";
	};
	disabled?: boolean;
};

export function DangerZoneSection({
	faculty,
	disabled,
}: DangerZoneSectionProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const activateFaculty = useInsMutation(api.faculty.activate);
	const deactivateFaculty = useInsMutation(api.faculty.deactivate);

	const displayName = `${faculty.firstName} ${faculty.lastName}`.trim();
	const isActive = faculty.status === "active";

	async function handleConfirm() {
		setIsSubmitting(true);
		setError(null);
		try {
			if (isActive) {
				await deactivateFaculty({ id: faculty._id });
			} else {
				await activateFaculty({ id: faculty._id });
			}
			setConfirmOpen(false);
		} catch (submitError) {
			setError(getConvexErrorMessage(submitError, "Action failed"));
		} finally {
			setIsSubmitting(false);
		}
	}

	if (disabled) return null;

	return (
		<>
			<Card className="ring-0! bg-transparent">
				<CardHeader className="px-0">
					<CardTitle className="text-destructive">Danger zone</CardTitle>
					<CardDescription>
						All desctructive actions in one place. Use with caution.
					</CardDescription>
				</CardHeader>

				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>{isActive ? "Deactivate" : "Reactivate"}</ItemTitle>
							<ItemDescription className="pr-8">
								{isActive ? "Deactivate" : "Reactivate"} <b>{displayName}</b> ?
								He will be moved to the inactive list and lose active faculty
								status. This faculty member can't be assigned to any classes or
								subjects further until they reactivated.
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button
								variant="destructive"
								onClick={() => setConfirmOpen(true)}
							>
								{isActive ? "Deactivate faculty" : "Activate faculty"}
							</Button>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>
							{isActive ? "Deactivate" : "Activate"} {displayName}?
						</DialogTitle>
						<DialogDescription>
							{isActive
								? "They will be moved to the inactive list and lose active faculty status."
								: "They will be restored to the active faculty list."}
						</DialogDescription>
					</DialogHeader>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button
							variant={isActive ? "destructive" : "default"}
							disabled={isSubmitting}
							onClick={() => void handleConfirm()}
						>
							{isActive ? "Deactivate" : "Activate"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
