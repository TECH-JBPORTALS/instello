"use client";

import { cn } from "@/lib/utils";
import { ADD_FACULTY_STEPS } from "../constants";

export function AddFacultyStepIndicator({ step }: { step: number }) {
	return (
		<ol className="mb-6 flex items-center gap-2">
			{ADD_FACULTY_STEPS.map((label, index) => {
				const isActive = index === step;
				const isComplete = index < step;

				return (
					<li key={label} className="flex flex-1 items-center gap-2">
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
										isActive && "bg-primary text-primary-foreground",
										isComplete && "bg-primary/15 text-primary",
										!isActive &&
											!isComplete &&
											"bg-muted text-muted-foreground",
									)}
								>
									{index + 1}
								</span>
								<span
									className={cn(
										"truncate text-sm",
										isActive && "font-medium text-foreground",
										!isActive && "text-muted-foreground",
									)}
								>
									{label}
								</span>
							</div>
							<div
								className={cn(
									"ml-3 h-0.5 rounded-full",
									index < ADD_FACULTY_STEPS.length - 1 ? "block" : "hidden",
									isComplete ? "bg-primary" : "bg-border",
								)}
							/>
						</div>
					</li>
				);
			})}
		</ol>
	);
}
