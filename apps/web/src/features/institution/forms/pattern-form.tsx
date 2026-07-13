"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import { Field, FieldError, FieldGroup } from "@instello/ui/components/field";
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
import { IconCalendarEvent, IconCircleCheckFilled } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { isEmpty, isUndefined } from "lodash";
import { PatternAvatar } from "@/features/academic-patterns/components/pattern-avatar";
import { TemplateBadge } from "@/features/academic-patterns/components/pattern-badges";
import { formatPatternSummary } from "@/features/academic-patterns/constants";
import { withForm } from "@/hooks/form";
import { cn } from "@/lib/utils";
import { newInstitutionFormOpt, PatternSchema } from "./shared-form";

function PatternListSkeleton({ count }: { count: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 rounded-lg border p-3">
					<Skeleton className="size-10 rounded-lg" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-3 w-28" />
						<Skeleton className="h-2 w-44" />
					</div>
				</div>
			))}
		</div>
	);
}

export const PatternForm = withForm({
	...newInstitutionFormOpt,
	props: {
		step: 2,
		setStep: (_step: number) => {},
	},
	render: function Render({ form, step, setStep }) {
		const patterns = useQuery(api.academicPattern.queries.list);

		return (
			<form.FormGroup
				name="pattern"
				validators={{
					onDynamic: PatternSchema,
				}}
				onGroupSubmit={() => {
					form.handleSubmit();
				}}
				children={(formGroup) => (
					<form
						className="flex min-h-[520px] min-w-sm flex-col"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							formGroup.handleSubmit();
						}}
					>
						<CardHeader className="shrink-0 p-0">
							<CardTitle className="text-lg">Academic pattern</CardTitle>
							<CardDescription>
								Choose the academic structure this institution will follow
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 px-0 py-4">
							<FieldGroup>
								<form.AppField
									name="pattern.academicPatternId"
									children={(field) => {
										const showErrors =
											field.state.meta.isTouched ||
											formGroup.state.meta.submissionAttempts > 0;
										const isInvalid = showErrors && !field.state.meta.isValid;

										if (isUndefined(patterns)) {
											return <PatternListSkeleton count={2} />;
										}

										if (isEmpty(patterns)) {
											return (
												<Empty className="min-h-48 border border-border border-dashed">
													<EmptyMedia variant="icon">
														<IconCalendarEvent />
													</EmptyMedia>
													<EmptyHeader>
														<EmptyTitle>No patterns available</EmptyTitle>
														<EmptyDescription>
															Create academic patterns in your organization
															settings first.
														</EmptyDescription>
													</EmptyHeader>
												</Empty>
											);
										}

										return (
											<Field data-invalid={isInvalid}>
												<ItemGroup className="rounded-lg border bg-background">
													{patterns.map((pattern) => {
														const selected = field.state.value === pattern._id;

														return (
															<Item
																key={pattern._id}
																className={cn(
																	"cursor-pointer rounded-none border-x-0 border-t-0 border-border! last:border-b-0 hover:bg-accent/30",
																	selected && "bg-accent/50",
																)}
																onClick={() => {
																	field.handleChange(pattern._id);
																	field.handleBlur();
																}}
															>
																<ItemMedia variant="image">
																	<PatternAvatar name={pattern.name} />
																</ItemMedia>
																<ItemContent>
																	<ItemTitle>{pattern.name}</ItemTitle>
																	<ItemDescription>
																		{formatPatternSummary(
																			pattern.systemType,
																			pattern.durationInYears,
																			pattern.stageCount,
																		)}
																	</ItemDescription>
																</ItemContent>
																<ItemActions className="flex items-center gap-2">
																	<TemplateBadge
																		templateKey={pattern.templateKey}
																	/>
																	{selected && (
																		<IconCircleCheckFilled className="size-4 text-primary" />
																	)}
																</ItemActions>
															</Item>
														);
													})}
												</ItemGroup>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
							</FieldGroup>
						</CardContent>
						<CardFooter className="mt-auto shrink-0 border-t-0 bg-transparent">
							<form.AppForm>
								<Field orientation={"horizontal"} className="justify-end">
									<Button
										type="button"
										variant={"outline"}
										onClick={() => setStep(step - 1)}
									>
										Back
									</Button>
									<form.SubscribeButton label="Create institution" />
								</Field>
							</form.AppForm>
						</CardFooter>
					</form>
				)}
			/>
		);
	},
});
