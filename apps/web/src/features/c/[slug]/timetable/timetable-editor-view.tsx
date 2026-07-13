"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import { Input } from "@instello/ui/components/input";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { TimetableEditorShell } from "@/components/timetable/timetable";
import {
	createDefaultSessionConfig,
	dtoToHourSpans,
	dtoToSessionConfig,
	hourSpansEqual,
	hourSpansToSlotInputs,
	mapBatches,
	mapProgramSubjects,
	sessionConfigEqual,
	type TimetableDto,
} from "@/components/timetable/timetable-mappers";
import type {
	TimetableBatchOption,
	TimetableSubjectOption,
} from "@/components/timetable/types";
import { useTimetableEditor } from "@/components/timetable/use-timetable-editor";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { getConvexErrorMessage } from "@/lib/convex-error";

function TimetableEditorSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-10 w-48" />
			<Skeleton className="h-[480px] w-full rounded-lg" />
		</div>
	);
}

function TimetableEditorLoaded({
	basePath,
	programId,
	classSlug,
	latestTimetable,
	subjects,
	batches,
}: {
	basePath: string;
	programId: Id<"programs">;
	classSlug: string;
	latestTimetable: TimetableDto | null;
	subjects: TimetableSubjectOption[];
	batches: TimetableBatchOption[];
}) {
	const router = useRouter();
	const [changeMessage, setChangeMessage] = useState("");
	const [messageError, setMessageError] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const initialSpans = useMemo(
		() => (latestTimetable ? dtoToHourSpans(latestTimetable, subjects) : []),
		[latestTimetable, subjects],
	);

	const initialSessionConfig = useMemo(
		() =>
			latestTimetable
				? dtoToSessionConfig(latestTimetable)
				: createDefaultSessionConfig(),
		[latestTimetable],
	);

	const editor = useTimetableEditor({
		initialSpans,
		initialSessionConfig,
		subjects,
		batches,
	});

	const createTimetable = useInsMutation(api.timetables.create);

	const hasChanges = latestTimetable
		? !hourSpansEqual(editor.spans, initialSpans) ||
			!sessionConfigEqual(editor.sessionConfig, initialSessionConfig)
		: editor.spans.length > 0 ||
			!sessionConfigEqual(editor.sessionConfig, createDefaultSessionConfig());

	async function handleSave() {
		if (isSaving) return;

		setSaveError(null);
		setMessageError(false);

		if (!hasChanges) {
			toast.error("No changes to save");
			return;
		}

		if (!changeMessage.trim()) {
			setMessageError(true);
			return;
		}

		if (!editor.isSessionConfigValid) {
			toast.error("Fix session timing before saving");
			editor.setSidePanelTab("timing");
			return;
		}

		setIsSaving(true);

		try {
			await createTimetable({
				programId,
				classAlias: classSlug,
				changeMessage: changeMessage.trim(),
				slots: hourSpansToSlotInputs(editor.spans),
				sessionConfig: editor.sessionConfig,
			});
			router.push(basePath);
		} catch (error) {
			setSaveError(getConvexErrorMessage(error, "Failed to save timetable"));
		} finally {
			setIsSaving(false);
		}
	}

	function handleChangeMessage(value: string) {
		setChangeMessage(value);
		if (value.trim()) {
			setMessageError(false);
		}
	}

	return (
		<>
			<TimetableSavePanel
				changeMessage={changeMessage}
				messageError={messageError}
				saveError={saveError}
				isSaving={isSaving}
				onChangeMessage={handleChangeMessage}
				onSave={handleSave}
			/>
			<TimetableEditorShell editor={editor} />
		</>
	);
}

function TimetableSavePanel({
	changeMessage,
	messageError,
	saveError,
	isSaving,
	onChangeMessage,
	onSave,
}: {
	changeMessage: string;
	messageError: boolean;
	saveError: string | null;
	isSaving: boolean;
	onChangeMessage: (value: string) => void;
	onSave: () => void;
}) {
	return (
		<div className="py-4 flex w-full gap-3.5">
			<div className="flex w-full flex-1 flex-col gap-2">
				<Input
					id="change-message"
					placeholder="Describe what changed in this version"
					value={changeMessage}
					aria-invalid={messageError}
					onChange={(event) => onChangeMessage(event.target.value)}
				/>
				{messageError ? (
					<p className="text-sm text-destructive">Change message is required</p>
				) : null}
				{saveError ? (
					<p className="text-sm text-destructive">{saveError}</p>
				) : null}
			</div>
			<Button type="button" onClick={onSave} disabled={isSaving}>
				{isSaving ? "Saving..." : "Save timetable"}
			</Button>
		</div>
	);
}

export function TimetableEditorView({ basePath }: { basePath: string }) {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();

	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});
	const cls = useInsQuery(
		api.classes.getBySlug,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);

	const latestTimetable = useInsQuery(
		api.timetables.getOrNull,
		program && classSlug
			? { programId: program._id, classAlias: classSlug }
			: "skip",
	);

	const programSubjects = useInsQuery(
		api.programSubjects.listByStage,
		program && cls
			? {
					programId: program._id,
					academicStageId: cls.currentHeadStage._id,
				}
			: "skip",
	);

	const batches = useInsQuery(
		api.classBatches.list,
		cls?.isGroupsEnabled ? { classId: cls._id } : "skip",
	);

	const isLoading =
		program === undefined ||
		cls === undefined ||
		latestTimetable === undefined ||
		programSubjects === undefined ||
		(cls?.isGroupsEnabled && batches === undefined);

	const subjects = useMemo(
		() => (programSubjects ? mapProgramSubjects(programSubjects) : []),
		[programSubjects],
	);

	const batchOptions = useMemo(
		() => (batches ? mapBatches(batches) : []),
		[batches],
	);

	return (
		<Container className="relative flex min-h-0 px-8! xl:px-8! 2xl:px-8! flex-1 flex-col pb-24">
			<PageHeader>
				<PageHeaderStart>
					<div>
						<Button
							nativeButton={false}
							variant="ghost"
							className="-mx-3.5 w-fit rounded-full text-muted-foreground"
							render={<Link href={basePath} />}
						>
							<IconArrowLeft />
							Back to timetable
						</Button>
						<PageHeaderTitle>
							{latestTimetable ? "New timetable version" : "Create timetable"}
						</PageHeaderTitle>
					</div>
					<PageHeaderDescription>
						{latestTimetable
							? `Editing a new version for ${cls?.name ?? "this class"} in ${program?.name ?? "this program"}.`
							: `Set up the first timetable for ${cls?.name ?? "this class"} in ${program?.name ?? "this program"}.`}
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			{isLoading || !program || !cls ? (
				<TimetableEditorSkeleton />
			) : (
				<TimetableEditorLoaded
					basePath={basePath}
					programId={program._id}
					classSlug={classSlug}
					latestTimetable={latestTimetable}
					subjects={subjects}
					batches={batchOptions}
				/>
			)}
		</Container>
	);
}
