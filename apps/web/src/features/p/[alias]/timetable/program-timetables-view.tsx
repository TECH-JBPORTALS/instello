"use client";

import { api } from "@instello/convex/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import { Card, CardHeader, CardTitle } from "@instello/ui/components/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { IconTable, IconTag, IconUser } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import {
	getClassMockTimetableInfo,
	PROGRAM_TIMETABLE_MOCK_GROUPS,
} from "@/features/timetable/dummy-timetable-data";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { programPath } from "@/lib/program-path";

export function ProgramTimetablesView() {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });

	return (
		<Container className="flex min-h-0 flex-1 flex-col">
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Timetables</PageHeaderTitle>
					<PageHeaderDescription>
						Manage timetables for{" "}
						<i className="text-foreground">{program?.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<div className="space-y-6">
				{PROGRAM_TIMETABLE_MOCK_GROUPS.map((group) => (
					<Card
						key={group.stage.id}
						className="bg-transparent ring-0! shadow-none"
					>
						<CardHeader className="px-0">
							<CardTitle>{group.stage.name}</CardTitle>
						</CardHeader>
						<ItemGroup className="bg-card" variant="stack">
							{group.classes.map((cls) => {
								const { publishInfo } = getClassMockTimetableInfo(cls.slug);
								return (
									<Item
										className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
										key={cls.id}
										render={
											<Link
												href={programPath(
													programAlias,
													`timetables/${cls.slug}`,
												)}
											/>
										}
									>
										<ItemMedia variant="icon">
											<Avatar size="lg" className={"after:rounded-lg"}>
												<AvatarFallback className="rounded-lg">
													<IconTable />
												</AvatarFallback>
											</Avatar>
										</ItemMedia>
										<ItemContent>
											<ItemTitle>{cls.name}</ItemTitle>
											<div className="flex items-center gap-1.5">
												<Avatar size="xs">
													{publishInfo.publisher.image ? (
														<AvatarImage
															src={publishInfo.publisher.image}
															alt={publishInfo.publisher.name}
														/>
													) : null}
													<AvatarFallback>
														<IconUser className="size-3" />
													</AvatarFallback>
												</Avatar>
												<strong className="text-xs text-muted-foreground">
													{publishInfo.publisher.name}
												</strong>
												<span className="text-muted-foreground font-bold">
													·
												</span>
												<ItemDescription className="truncate text-muted-foreground">
													{publishInfo.message}
												</ItemDescription>
											</div>
										</ItemContent>
										<ItemActions>
											<span className="text-xs text-muted-foreground">
												{formatDistanceToNow(publishInfo.publishedAt, {
													addSuffix: true,
												})}
											</span>
											<Badge variant="outline" className="gap-1">
												<IconTag className="size-3" />v
												{publishInfo.currentVersion}
											</Badge>
										</ItemActions>
									</Item>
								);
							})}
						</ItemGroup>
					</Card>
				))}
			</div>
		</Container>
	);
}
