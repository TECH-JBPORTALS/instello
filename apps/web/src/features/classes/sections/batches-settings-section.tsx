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

export function BatchesSettingsSection({ cls }: BatchesSettingsSectionProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const enableBatches = useInsMutation(api.classes.enableSectionGroups);
	const disableBatches = useInsMutation(api.classes.disableSectionGroups);
	const updateNamingConvention = useInsMutation(
		api.classBatches.updateNamingConvention,
	);

	const batches = useInsQuery(
		api.classBatches.list,
		cls.isGroupsEnabled ? { classId: cls._id } : "skip",
	);

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
			setConfirmOpen(false);
		} catch (submitError) {
			setError(getConvexErrorMessage(submitError, "Failed to disable batches"));
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
										setConfirmOpen(true);
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

					{cls.isGroupsEnabled && batches && batches.length > 0 && (
						<Item variant="outline">
							<ItemContent>
								<ItemTitle>Current batches</ItemTitle>
								<ItemDescription>
									{batches.map((batch) => batch.label).join(", ")}
								</ItemDescription>
							</ItemContent>
						</Item>
					)}
				</ItemGroup>

				{error && <p className="text-sm text-destructive">{error}</p>}
			</Card>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
							onClick={() => setConfirmOpen(false)}
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
		</>
	);
}
