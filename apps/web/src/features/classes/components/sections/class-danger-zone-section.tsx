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
import { programPath } from "@/features/programs/program-path";
import { useInsMutation } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { getConvexErrorMessage } from "@/lib/convex-error";

type ClassDangerZoneSectionProps = {
	cls: {
		_id: Id<"classes">;
		name: string;
	};
};

export function ClassDangerZoneSection({ cls }: ClassDangerZoneSectionProps) {
	const router = useRouter();
	const programAlias = useProgramAlias();
	const removeClass = useInsMutation(api.class.mutations.remove);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmation, setConfirmation] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const expectedPhrase = useMemo(() => `I am deleting ${cls.name}`, [cls.name]);
	const canConfirm = confirmation.trim() === expectedPhrase;

	async function handleConfirm() {
		if (!canConfirm) return;

		setIsSubmitting(true);
		setError(null);
		try {
			await removeClass({ id: cls._id });
			setConfirmOpen(false);
			toast.success("Class has been deleted");
			router.push(programPath(programAlias, "/classes"));
		} catch (submitError) {
			setError(getConvexErrorMessage(submitError, "Failed to delete class"));
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle className="text-destructive">Danger zone</CardTitle>
					<CardDescription>
						Destructive actions for this class. Use with caution.
					</CardDescription>
				</CardHeader>

				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Delete class</ItemTitle>
							<ItemDescription className="pr-8">
								Permanently delete <b>{cls.name}</b> and all of its students,
								batches, timetables, attendance, and related data. This cannot
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
								Delete class
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
						<DialogTitle>Delete {cls.name}?</DialogTitle>
						<DialogDescription>
							This permanently deletes the class and all related data. Type{" "}
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
							{isSubmitting ? "Deleting…" : "Delete class"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
