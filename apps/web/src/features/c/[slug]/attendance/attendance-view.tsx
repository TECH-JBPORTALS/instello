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
import { useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { classPath } from "@/lib/class-path";
import { CLASS_ATTENDANCE_REGISTERS_MOCK } from "./dummy-attendance-data";

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

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 300);

		return () => clearTimeout(timeout);
	}, [searchQuery]);

	const query = debouncedSearch.trim().toLowerCase();
	const registers = CLASS_ATTENDANCE_REGISTERS_MOCK.filter((register) => {
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

			<ItemGroup className="bg-card" variant="stack">
				{registers.map((register) => {
					const isPractical = register.type === "practical";

					return (
						<Item
							className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
							key={register.id}
							render={
								<Link
									href={classPath(
										programAlias,
										classSlug,
										`attendance/${register.id}`,
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
							</ItemContent>
							<ItemActions>
								<span className="text-xs text-muted-foreground">
									last updated{" "}
									{formatDistanceToNow(register.activity.updatedAt, {
										addSuffix: true,
									})}
								</span>
							</ItemActions>
						</Item>
					);
				})}
			</ItemGroup>
		</Container>
	);
}
