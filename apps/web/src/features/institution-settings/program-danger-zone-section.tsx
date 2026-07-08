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
import { Input } from "@instello/ui/components/input";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@instello/ui/components/item";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";

type ProgramDangerZoneSectionProps = {
	program: {
		_id: Id<"programs">;
		name: string;
	};
};

export function ProgramDangerZoneSection({
	program,
}: ProgramDangerZoneSectionProps) {
	const router = useRouter();
	const removeProgram = useInsMutation(api.programs.remove);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmation, setConfirmation] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const expectedPhrase = useMemo(
		() => `I am deleting ${program.name}`,
		[program.name],
	);
	const canConfirm = confirmation.trim() === expectedPhrase;

	async function handleConfirm() {
		if (!canConfirm) return;

		setIsSubmitting(true);
		setError(null);
		try {
			await removeProgram({ id: program._id });
			setConfirmOpen(false);
			toast.success("Program has been deleted");
			router.push("/institution-settings");
		} catch (submitError) {
			setError(getConvexErrorMessage(submitError, "Failed to delete program"));
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<Card className="ring-0! bg-transparent">
				<CardHeader className="px-0">
					<CardTitle className="text-destructive">Danger zone</CardTitle>
					<CardDescription>
						Destructive actions for this program. Use with caution.
					</CardDescription>
				</CardHeader>

				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Delete program</ItemTitle>
							<ItemDescription className="pr-8">
								Permanently delete <b>{program.name}</b> and all of its classes,
								students, timetables, attendance, and related data. This cannot
								be undone.
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button
								variant="destructive"
								onClick={() => {
									setConfirmation("");
									setError(null);
									setConfirmOpen(true);
								}}
							>
								Delete program
							</Button>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>

			<Dialog
				open={confirmOpen}
				onOpenChange={(open) => {
					setConfirmOpen(open);
					if (!open) {
						setConfirmation("");
						setError(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Delete {program.name}?</DialogTitle>
						<DialogDescription>
							This permanently deletes the program and all related data. Type{" "}
							<code className="rounded bg-muted px-1 py-0.5 text-foreground">
								{expectedPhrase}
							</code>{" "}
							to confirm.
						</DialogDescription>
					</DialogHeader>
					<Input
						value={confirmation}
						onChange={(event) => setConfirmation(event.target.value)}
						placeholder={expectedPhrase}
						autoComplete="off"
						aria-label="Deletion confirmation phrase"
					/>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={!canConfirm || isSubmitting}
							onClick={() => void handleConfirm()}
						>
							{isSubmitting ? "Deleting…" : "Delete program"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
