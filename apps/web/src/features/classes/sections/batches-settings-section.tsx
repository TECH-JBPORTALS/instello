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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Switch } from "@instello/ui/components/switch";
import { useState } from "react";
import { toast } from "sonner";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";

type BatchNamingConvention = "numeric" | "alphabetic";

const NAMING_CONVENTION_LABELS: Record<BatchNamingConvention, string> = {
	numeric: "Numeric",
	alphabetic: "Alphabetic",
};

type BatchesSettingsSectionProps = {
	cls: {
		_id: Id<"classes">;
		isGroupsEnabled: boolean;
		batchNamingConvention?: BatchNamingConvention;
	};
};

function formatStudentCount(count: number) {
	return count === 1 ? "1 student" : `${count} students`;
}

export function BatchesSettingsSection({ cls }: BatchesSettingsSectionProps) {
	const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
	const [batchToDelete, setBatchToDelete] = useState<Id<"classBatches"> | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const enableBatches = useInsMutation(api.classes.enableSectionGroups);
	const disableBatches = useInsMutation(api.classes.disableSectionGroups);
	const removeBatch = useInsMutation(api.classBatches.remove);
	const updateNamingConvention = useInsMutation(
		api.classBatches.updateNamingConvention,
	);

	const batches = useInsQuery(
		api.classBatches.list,
		cls.isGroupsEnabled ? { classId: cls._id } : "skip",
	);

	const removePreview = useInsQuery(
		api.classBatches.getRemovePreview,
		batchToDelete ? { batchId: batchToDelete } : "skip",
	);

	const canDeleteBatch = (batches?.length ?? 0) > 1;

	async function handleEnable() {
		setIsSubmitting(true);
		setError(null);
		try {
			await enableBatches({ id: cls._id });
		} catch (submitError) {
			setError(getConvexErrorMessage(submitError, "Failed to enable batches"));
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleDisable() {
		setIsSubmitting(true);
		setError(null);
		try {
			await disableBatches({ id: cls._id });
			setDisableConfirmOpen(false);
		} catch (submitError) {
			setError(getConvexErrorMessage(submitError, "Failed to disable batches"));
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleDeleteBatch() {
		if (!batchToDelete) {
			toast.error("No batch selected for deletion");
			return;
		}
		if (!removePreview) {
			toast.error("Delete preview is still loading");
			return;
		}
		if (!removePreview.canDelete) {
			toast.error(
				"This is the only batch left in this class. Disable batches for the class instead.",
			);
			return;
		}
		if (removePreview.hasTimetableConflict) {
			toast.error(
				removePreview.blockedReason ??
					"This batch has timetable conflicts with the destination batch. Resolve conflicts before deleting.",
			);
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			await removeBatch({ batchId: batchToDelete });
			setBatchToDelete(null);
			toast.success("Batch has been deleted");
		} catch (submitError) {
			const message = getConvexErrorMessage(
				submitError,
				"Failed to delete batch",
			);
			setError(message);
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleNamingConventionChange(value: string) {
		if (value !== "numeric" && value !== "alphabetic") return;
		setError(null);
		try {
			await updateNamingConvention({
				classId: cls._id,
				namingConvention: value,
			});
		} catch (submitError) {
			setError(
				getConvexErrorMessage(
					submitError,
					"Failed to update naming convention",
				),
			);
		}
	}

	function renderDeleteDescription() {
		if (!removePreview) {
			return "Loading delete preview…";
		}

		if (!removePreview.canDelete) {
			return "This is the only batch left in this class. Disable batches for the class instead of deleting it.";
		}

		if (removePreview.hasTimetableConflict) {
			return (
				removePreview.blockedReason ??
				"This batch has timetable conflicts with the destination batch. Resolve conflicts before deleting."
			);
		}

		if (removePreview.studentCount > 0 && removePreview.moveToBatch) {
			return (
				<>
					Delete <b>{removePreview.batchLabel}</b>?{" "}
					<b>{formatStudentCount(removePreview.studentCount)}</b> in this batch
					will be moved to <b>{removePreview.moveToBatch.label}</b>. Related
					timetable slots will be moved to{" "}
					<b>{removePreview.moveToBatch.label}</b> and attendance history will
					be archived. This can&apos;t be undone.
				</>
			);
		}

		return (
			<>
				Delete <b>{removePreview.batchLabel}</b>? Timetable slots for this batch
				will be moved to{" "}
				<b>{removePreview.moveToBatch?.label ?? "another batch"}</b> and
				attendance history will be archived. This can&apos;t be undone.
			</>
		);
	}

	return (
		<>
			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Batches</CardTitle>
					<CardDescription>
						Divide students in this class into smaller groups
					</CardDescription>
				</CardHeader>

				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Enable batches</ItemTitle>
							<ItemDescription className="pr-8">
								{cls.isGroupsEnabled
									? "Students in this class are divided into batches."
									: "Existing students will be split evenly into two batches. New classes start with two empty batches."}
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Switch
								checked={cls.isGroupsEnabled}
								disabled={isSubmitting}
								onCheckedChange={(checked) => {
									if (checked) {
										void handleEnable();
									} else {
										setDisableConfirmOpen(true);
									}
								}}
							/>
						</ItemActions>
					</Item>

					{cls.isGroupsEnabled && (
						<Item variant="outline">
							<ItemContent>
								<ItemTitle>Naming convention</ItemTitle>
								<ItemDescription>
									How batch labels are displayed
								</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Select
									value={cls.batchNamingConvention ?? "numeric"}
									onValueChange={(value) => {
										if (value) void handleNamingConventionChange(value);
									}}
								>
									<SelectTrigger className="min-w-3xs">
										<SelectValue>
											{
												NAMING_CONVENTION_LABELS[
													cls.batchNamingConvention ?? "numeric"
												]
											}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="numeric">
											{NAMING_CONVENTION_LABELS.numeric}
										</SelectItem>
										<SelectItem value="alphabetic">
											{NAMING_CONVENTION_LABELS.alphabetic}
										</SelectItem>
									</SelectContent>
								</Select>
							</ItemActions>
						</Item>
					)}

					{cls.isGroupsEnabled &&
						batches?.map((batch) => (
							<Item key={batch._id} variant="outline">
								<ItemContent>
									<ItemTitle>{batch.label}</ItemTitle>
									<ItemDescription>
										{formatStudentCount(batch.studentCount)}
									</ItemDescription>
								</ItemContent>
								<ItemActions>
									<Button
										variant="destructive"
										size="sm"
										disabled={!canDeleteBatch || isSubmitting}
										onClick={() => {
											setError(null);
											setBatchToDelete(batch._id);
										}}
									>
										Delete
									</Button>
								</ItemActions>
							</Item>
						))}
				</ItemGroup>

				{error && <p className="text-sm text-destructive">{error}</p>}
			</Card>

			<Dialog open={disableConfirmOpen} onOpenChange={setDisableConfirmOpen}>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Disable batches?</DialogTitle>
						<DialogDescription>
							All batches for this class will be deleted. Students will remain
							in the class but will lose their batch assignment. This can&apos;t
							be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDisableConfirmOpen(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={isSubmitting}
							onClick={() => void handleDisable()}
						>
							Disable batches
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={batchToDelete !== null}
				onOpenChange={(open) => {
					if (!open) {
						setBatchToDelete(null);
						setError(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>
							Delete {removePreview?.batchLabel ?? "batch"}?
						</DialogTitle>
						<DialogDescription>{renderDeleteDescription()}</DialogDescription>
					</DialogHeader>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setBatchToDelete(null)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={isSubmitting || !removePreview}
							onClick={() => void handleDeleteBatch()}
						>
							{isSubmitting ? "Deleting…" : "Delete batch"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
