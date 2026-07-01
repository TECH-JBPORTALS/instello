"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconPlus } from "@tabler/icons-react";
import { isEmpty, isUndefined } from "lodash";
import { useState } from "react";
import { NewClassDialog } from "@/features/classes/new-class-dialog";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { ClassAvatar } from "@/features/classes/class-avatar";

export function ClassSwitcher() {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const [selectedClassId, setSelectedClassId] = useState<Id<"classes"> | null>(
		null,
	);
	const [createOpen, setCreateOpen] = useState(false);
	const [selectOpen, setSelectOpen] = useState(false);
	const classes = useInsQuery(
		api.classes.listForSwitcher,
		program ? { programId: program._id } : "skip",
	);

	if (isUndefined(program) || isUndefined(classes)) {
		return <Skeleton className="mx-2 mb-2 h-8 w-auto rounded-lg" />;
	}

	return (
		<div>
			<NewClassDialog
				open={createOpen}
				setOpen={setCreateOpen}
				programId={program._id}
				onCreated={(classId) => {
					setSelectedClassId(classId);
				}}
			/>
			<Select
				open={selectOpen}
				onOpenChange={setSelectOpen}
				value={selectedClassId ?? null}
				onValueChange={(value) => {
					setSelectedClassId(value ? (value as Id<"classes">) : null);
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select class">
						<ClassAvatar size="sm" />
						{selectedClassId
							? classes.find((cls) => cls._id === selectedClassId)?.name
							: "Select a class"}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{isEmpty(classes) ? (
						<SelectItem value="__empty" disabled>
							No classes yet
						</SelectItem>
					) : (
						classes.map((cls) => (
							<SelectItem key={cls._id} value={cls._id}>
								<ClassAvatar size="sm" />
								{cls.name}
							</SelectItem>
						))
					)}
					<SelectSeparator />
					<div className="p-1">
						<Button
							type="button"
							variant="ghost"
							className="h-8 w-full justify-start px-2 font-normal"
							onClick={() => {
								setSelectOpen(false);
								setCreateOpen(true);
							}}
						>
							<IconPlus className="size-4" />
							Create new class
						</Button>
					</div>
				</SelectContent>
			</Select>
		</div>
	);
}
