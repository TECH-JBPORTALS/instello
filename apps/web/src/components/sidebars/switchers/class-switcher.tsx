"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Skeleton } from "@instello/ui/components/skeleton";
import { isEmpty, isUndefined } from "lodash";
import { useState } from "react";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function ClassSwitcher() {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const [selectedClassId, setSelectedClassId] = useState<Id<"classes"> | null>(
		null,
	);
	const classes = useInsQuery(
		api.classes.list,
		program ? { programId: program._id } : "skip",
	);

	if (isUndefined(program) || isUndefined(classes)) {
		return <Skeleton className="mx-2 mb-2 h-8 w-auto rounded-lg" />;
	}

	return (
		<div className="px-2 pb-2">
			<Select
				value={selectedClassId ?? null}
				onValueChange={(value) => {
					setSelectedClassId(value ? (value as Id<"classes">) : null);
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select class">
						{selectedClassId
							? classes.find((cls) => cls._id === selectedClassId)?.name
							: undefined}
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
								{cls.name}
							</SelectItem>
						))
					)}
				</SelectContent>
			</Select>
		</div>
	);
}
