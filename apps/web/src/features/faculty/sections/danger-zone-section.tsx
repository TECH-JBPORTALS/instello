"use client";

import { api } from "@instello/convex/api";
import { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import {
	Card,
	CardContent,
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
import { useMutation } from "convex/react";
import { useState } from "react";

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
	const activateFaculty = useMutation(api.faculty.activate);
	const deactivateFaculty = useMutation(api.faculty.deactivate);

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
			setError(
				submitError instanceof Error ? submitError.message : "Action failed",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (disabled) return null;

	return (
		<>
			<Card className="border-destructive/30">
				<CardHeader>
					<CardTitle className="text-destructive">Danger zone</CardTitle>
					<CardDescription>
						{isActive
							? "Deactivate this faculty member to revoke their active status."
							: "Reactivate this faculty member to restore their active status."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="destructive" onClick={() => setConfirmOpen(true)}>
						{isActive ? "Deactivate faculty" : "Activate faculty"}
					</Button>
				</CardContent>
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
