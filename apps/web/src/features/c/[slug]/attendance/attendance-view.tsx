"use client";

import { api } from "@instello/convex/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import {
	IconCalendarCheck,
	IconPencil,
	IconSearch,
	IconUser,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { subjectColorStyles } from "@/features/subjects/constants";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { classPath } from "@/lib/class-path";
import type { AttendanceRegisterDto } from "./types";

export function AttendanceView() {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const cls = useInsQuery(
		api.classes.getBySlug,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);

	const registers = useInsQuery(
		api.attendance.listRegisters,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);
	const bootstrapRegisters = useInsMutation(api.attendance.bootstrapRegisters);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 300);

		return () => clearTimeout(timeout);
	}, [searchQuery]);

	useEffect(() => {
		if (!program || !classSlug || registers === undefined) return;
		if (registers.length > 0) return;

		void bootstrapRegisters({ programId: program._id, classSlug });
	}, [bootstrapRegisters, classSlug, program, registers]);

	const query = debouncedSearch.trim().toLowerCase();
	const filteredRegisters = (registers ?? []).filter((register) => {
		if (!query) return true;
		return (
			register.subjectName.toLowerCase().includes(query) ||
			register.subjectCode.toLowerCase().includes(query)
		);
	});

	return (
		<Container className="flex min-h-0 flex-1 flex-col">
			<PageHeader className="h-auto flex-col items-start gap-4 sm:h-14 sm:flex-row sm:items-center">
				<PageHeaderStart>
					<PageHeaderTitle>Attendance Registers</PageHeaderTitle>
					<PageHeaderDescription>
						Manage attendance registers for{" "}
						<i className="text-foreground">{cls?.name ?? "this class"}</i>
					</PageHeaderDescription>
				</PageHeaderStart>

				<PageHeaderEnd className="w-full sm:w-auto">
					<InputGroup className="w-full sm:w-64">
						<InputGroupAddon>
							<IconSearch />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Search registers..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</InputGroup>
				</PageHeaderEnd>
			</PageHeader>

			{registers === undefined ? (
				<div className="space-y-3">
					{Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} className="h-16 w-full rounded-lg" />
					))}
				</div>
			) : (
				<ItemGroup className="bg-card" variant="stack">
					{filteredRegisters.map((register) => {
						const isPractical = register.type === "practical";

						return (
							<Item
								className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
								key={register._id}
								render={
									<Link
										href={classPath(
											programAlias,
											classSlug,
											`attendance/${register._id}`,
										)}
									/>
								}
							>
								<ItemMedia variant="icon">
									<Avatar size="lg" className="after:rounded-lg">
										<AvatarFallback
											className="rounded-lg"
											style={subjectColorStyles(register.subjectColor)}
										>
											{isPractical ? <IconPencil /> : <IconCalendarCheck />}
										</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										{register.subjectName}
										<Badge variant="outline">{register.subjectCode}</Badge>
										<Badge variant="outline" className="gap-1">
											{isPractical ? (
												<IconPencil className="size-3" />
											) : (
												<IconCalendarCheck className="size-3" />
											)}
											{isPractical ? "Practical" : "Theory"}
										</Badge>
										{isPractical && register.batchLabel ? (
											<Badge variant="outline">{register.batchLabel}</Badge>
										) : null}
									</ItemTitle>
									{register.activity ? (
										<div className="flex items-center gap-1.5">
											<Avatar size="xs">
												{register.activity.actor.image ? (
													<AvatarImage
														src={register.activity.actor.image}
														alt={register.activity.actor.name}
													/>
												) : null}
												<AvatarFallback>
													<IconUser className="size-3" />
												</AvatarFallback>
											</Avatar>
											<strong className="text-xs text-muted-foreground">
												{register.activity.actor.name}
											</strong>
											<span className="text-muted-foreground font-bold">·</span>
											<ItemDescription className="truncate text-muted-foreground">
												{register.activity.description}
											</ItemDescription>
										</div>
									) : (
										<ItemDescription className="text-muted-foreground">
											No attendance marked yet
										</ItemDescription>
									)}
								</ItemContent>
								{register.activity ? (
									<ItemActions>
										<span className="text-xs text-muted-foreground">
											last updated{" "}
											{formatDistanceToNow(register.activity.updatedAt, {
												addSuffix: true,
											})}
										</span>
									</ItemActions>
								) : null}
							</Item>
						);
					})}
				</ItemGroup>
			)}
		</Container>
	);
}
