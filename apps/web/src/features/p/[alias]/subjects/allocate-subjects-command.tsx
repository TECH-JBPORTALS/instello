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
	CommandShortcut,
} from "@instello/ui/components/command";
import { Kbd } from "@instello/ui/components/kbd";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconAlertCircle } from "@tabler/icons-react";
import { isUndefined } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { SubjectAvatar } from "@/features/subjects/components/subject-avatar";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import type { SubjectAllocationType } from "./constants";
import { SUBJECT_TYPE_OPTIONS } from "./constants";
import { SubjectTypeBadge } from "./subject-type-badge";

type AllocatableSubject = {
	_id: Id<"subjects">;
	name: string;
	code: string;
	color: string;
	remainingTypes: SubjectAllocationType[];
};

type Step = "select-subjects" | "select-type";

function SelectedSubjectsSummary({
	selected,
}: {
	selected: AllocatableSubject[];
}) {
	if (selected.length === 0) {
		return (
			<span className="text-xs text-muted-foreground">
				Select subjects to allocate
			</span>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-1">
			<Badge variant="secondary">
				{selected.length} {selected.length > 1 ? "subjects" : "subject"}{" "}
				selected
			</Badge>
		</div>
	);
}

function SelectSubjectSkeleton() {
	return (
		<div className="px-2 space-y-2">
			{Array.from({ length: 4 }).map((_, i) => (
				<Skeleton key={i} className="h-8 w-full" />
			))}
		</div>
	);
}

function SelectSubjectsStep({
	programId,
	academicStageId,
	open,
	onSelectSubject,
	selected,
	isAllocating,
}: {
	programId: Id<"programs">;
	academicStageId: Id<"academicStages">;
	open: boolean;
	onSelectSubject: (subject: AllocatableSubject) => void;
	selected: AllocatableSubject[];
	isAllocating: boolean;
}) {
	const [search, setSearch] = useState("");
	const allocatable = useInsQuery(
		api.programSubjects.listAllocatable,
		open ? { programId, academicStageId } : "skip",
	);

	return (
		<React.Fragment>
			<CommandInput
				autoFocus
				placeholder="Search subjects by code or name..."
				value={search}
				onValueChange={setSearch}
				disabled={isAllocating}
			/>
			<CommandList>
				<CommandEmpty>
					{isUndefined(allocatable) ? (
						<SelectSubjectSkeleton />
					) : (
						"No matching subjects."
					)}
				</CommandEmpty>
				<CommandGroup heading="SUBJECTS">
					{(allocatable ?? []).map((subject) => {
						const remainingType =
							subject.remainingTypes.length === 1
								? subject.remainingTypes[0]
								: null;
						const isSelected = selected.some((s) => s._id === subject._id);

						return (
							<CommandItem
								key={subject._id}
								value={`${subject.name} ${subject.code}`}
								data-checked={remainingType ? undefined : isSelected}
								disabled={isAllocating}
								onSelect={() => {
									onSelectSubject(subject);
									setSearch("");
								}}
							>
								<SubjectAvatar
									name={subject.name}
									color={subject.color}
									size="sm"
								/>
								<span>{subject.name}</span>
								<span className="text-xs text-muted-foreground uppercase">
									{subject.code}
								</span>
								{remainingType && (
									<span className="ml-auto">
										<SubjectTypeBadge type={remainingType} />
									</span>
								)}
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
		</React.Fragment>
	);
}

export function AllocateSubjectsCommand({
	open,
	onOpenChange,
	programId,
	academicStageId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	programId: Id<"programs">;
	academicStageId: Id<"academicStages">;
}) {
	const [step, setStep] = useState<Step>("select-subjects");
	const [selected, setSelected] = useState<AllocatableSubject[]>([]);
	const [isAllocating, setIsAllocating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [typeSearch, setTypeSearch] = useState("");

	const allocate = useInsMutation(api.programSubjects.allocate);

	const resetState = useCallback(() => {
		setStep("select-subjects");
		setSelected([]);
		setTypeSearch("");
		setError(null);
		setIsAllocating(false);
	}, []);

	useEffect(() => {
		if (!open) resetState();
	}, [open, resetState]);

	function toggleSubject(subject: AllocatableSubject) {
		setSelected((prev) =>
			prev.some((s) => s._id === subject._id)
				? prev.filter((s) => s._id !== subject._id)
				: [...prev, subject],
		);
	}

	const allocateRemaining = useCallback(
		async (subject: AllocatableSubject) => {
			const type = subject.remainingTypes[0];
			if (!type || subject.remainingTypes.length !== 1 || isAllocating) {
				return;
			}

			setError(null);
			setIsAllocating(true);

			try {
				await allocate({
					programId,
					academicStageId,
					subjectIds: [subject._id],
					type,
				});
			} catch (err) {
				setError(getConvexErrorMessage(err, "Failed to allocate subjects"));
			} finally {
				setIsAllocating(false);
			}
		},
		[isAllocating, allocate, programId, academicStageId],
	);

	function handleSubjectSelect(subject: AllocatableSubject) {
		if (subject.remainingTypes.length === 1) {
			void allocateRemaining(subject);
			return;
		}

		toggleSubject(subject);
	}

	const goToTypeStep = useCallback(() => {
		if (selected.length === 0) return;
		setError(null);
		setTypeSearch("");
		setStep("select-type");
	}, [selected]);

	const goBack = useCallback(() => {
		setError(null);
		setTypeSearch("");
		setStep("select-subjects");
	}, []);

	const confirmAllocation = useCallback(
		async (type: SubjectAllocationType) => {
			if (selected.length === 0 || isAllocating) return;

			setError(null);
			setIsAllocating(true);

			try {
				await allocate({
					programId,
					academicStageId,
					subjectIds: selected.map((subject) => subject._id),
					type,
				});
				onOpenChange(false);
			} catch (err) {
				setError(getConvexErrorMessage(err, "Failed to allocate subjects"));
			} finally {
				setIsAllocating(false);
			}
		},
		[
			selected,
			isAllocating,
			allocate,
			programId,
			academicStageId,
			onOpenChange,
		],
	);

	const handleKeyDown = useCallback(
		(ev: KeyboardEvent) => {
			if (step === "select-type" && !isAllocating) {
				const optionIndex = Number(ev.key) - 1;
				const option = SUBJECT_TYPE_OPTIONS[optionIndex];
				if (option && /^[1-9]$/.test(ev.key)) {
					ev.preventDefault();
					ev.stopPropagation();
					void confirmAllocation(option.value);
					return;
				}
			}

			if (!(ev.metaKey || ev.ctrlKey)) return;

			// Capture-phase: stop cmdk from also selecting/toggling the
			// highlighted item when advancing with ⌘Enter / ⌘⌫.
			if (ev.key === "Enter" && step === "select-subjects") {
				ev.preventDefault();
				ev.stopPropagation();
				goToTypeStep();
				return;
			}

			if (ev.key === "Backspace" && step === "select-type") {
				ev.preventDefault();
				ev.stopPropagation();
				goBack();
			}
		},
		[step, isAllocating, goToTypeStep, goBack, confirmAllocation],
	);

	useEffect(() => {
		if (!open) return;
		document.addEventListener("keydown", handleKeyDown, true);
		return () => document.removeEventListener("keydown", handleKeyDown, true);
	}, [open, handleKeyDown]);

	const selectedCount = selected.length;

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Allocate subjects"
			description="Search and select subjects to allocate to this academic stage."
			className="min-w-lg max-w-min"
		>
			<Command>
				<div className="flex items-center justify-between gap-2 py-2 px-3">
					<SelectedSubjectsSummary selected={selected} />

					<div className="flex shrink-0 items-center gap-1.5">
						{step === "select-type" ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={goBack}
								disabled={isAllocating}
								className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
							>
								Back <Kbd className="scale-90">⌘⌫</Kbd>
							</Button>
						) : (
							<>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => onOpenChange(false)}
									className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
								>
									Cancel <Kbd className="scale-90">ESC</Kbd>
								</Button>
								<Button
									type="button"
									size="sm"
									disabled={selectedCount === 0 || isAllocating}
									onClick={goToTypeStep}
									className="h-7 gap-1.5 px-2 text-xs"
								>
									Allocate
									<Kbd className="scale-90 bg-primary-foreground/20 text-primary-foreground/70">
										⌘⏎
									</Kbd>
								</Button>
							</>
						)}
					</div>
				</div>

				{step === "select-subjects" ? (
					<SelectSubjectsStep
						academicStageId={academicStageId}
						programId={programId}
						open={open}
						onSelectSubject={handleSubjectSelect}
						selected={selected}
						isAllocating={isAllocating}
					/>
				) : (
					<>
						<CommandInput
							autoFocus
							value={typeSearch}
							onValueChange={setTypeSearch}
							placeholder="Search types..."
							disabled={isAllocating}
						/>
						<CommandList>
							<CommandEmpty>No matching types</CommandEmpty>
							<CommandGroup heading="TYPE">
								{SUBJECT_TYPE_OPTIONS.map((option, index) => {
									const shortcut = String(index + 1);

									return (
										<CommandItem
											key={option.value}
											value={`${option.label} ${option.value}`}
											disabled={isAllocating}
											onSelect={() => {
												void confirmAllocation(option.value);
											}}
										>
											<option.icon />
											{option.label}
											<CommandShortcut>
												<Kbd className="scale-90">{shortcut}</Kbd>
											</CommandShortcut>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</>
				)}

				{error && (
					<div className="flex items-center gap-2 border-t px-3 py-2 text-xs text-destructive">
						<IconAlertCircle className="size-3.5 shrink-0" />
						{error}
					</div>
				)}
			</Command>
		</CommandDialog>
	);
}
