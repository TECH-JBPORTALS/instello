"use client";

import { api } from "@instello/convex/api";
import { Badge } from "@instello/ui/components/badge";
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
import { Spinner } from "@instello/ui/components/spinner";
import { IconPlus } from "@tabler/icons-react";
import { isEmpty, isUndefined } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ClassAvatar } from "@/features/classes/class-avatar";
import { NewClassDialog } from "@/features/classes/new-class-dialog";
import { useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { classPath } from "@/lib/class-path";
import { getClassSegment } from "@/lib/sidebar-mode";

export function ClassSwitcher() {
	const router = useRouter();
	const pathname = usePathname();
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [selectOpen, setSelectOpen] = useState(false);
	const classes = useInsQuery(
		api.classes.listForSwitcher,
		program ? { programId: program._id } : "skip",
	);

	if (isUndefined(program) || isUndefined(classes)) {
		return (
			<Skeleton className="h-8 border w-auto text-xs text-muted-foreground flex items-center gap-2 px-2">
				<Spinner className="size-3" />
				Loading classes...
			</Skeleton>
		);
	}

	const selectedClass = classSlug
		? classes.find((cls) => cls.slug === classSlug)
		: undefined;
	const currentSegment = getClassSegment(pathname) ?? "students";

	return (
		<div>
			<NewClassDialog
				open={createOpen}
				setOpen={setCreateOpen}
				programId={program._id}
				programAlias={programAlias}
			/>
			<Select
				open={selectOpen}
				onOpenChange={setSelectOpen}
				value={selectedClass?.slug ?? null}
				onValueChange={(value) => {
					if (!value) return;
					router.push(classPath(programAlias, value, currentSegment));
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select class">
						<ClassAvatar size="sm" />
						{selectedClass?.name ? (
							<>
								<span>{selectedClass.name}</span>
								<Badge
									variant={"outline"}
									className="text-muted-foreground uppercase text-xs!"
								>
									{selectedClass.currentHeadStage.alias}
								</Badge>
							</>
						) : (
							"Select a class"
						)}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{isEmpty(classes) ? (
						<SelectItem value="__empty" disabled>
							No classes yet
						</SelectItem>
					) : (
						classes.map((cls) => (
							<SelectItem key={cls._id} value={cls.slug}>
								<ClassAvatar size="sm" />
								{cls.name}
								<Badge
									variant={"outline"}
									className="text-muted-foreground uppercase text-xs!"
								>
									{cls.currentHeadStage.alias}
								</Badge>
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
