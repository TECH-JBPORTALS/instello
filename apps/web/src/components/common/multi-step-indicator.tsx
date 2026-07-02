"use client";

/**
 * Animated multi-step progress indicator for wizard-style dialogs and forms.
 *
 * Use this when a flow is split into sequential steps (e.g. add faculty, add student).
 * The component is label-agnostic: pass step labels from feature constants so each
 * feature owns its copy and ordering.
 *
 * **Conventions**
 * - `step` is **0-based** (0 = first step).
 * - `steps` is a readonly tuple/array of human-readable labels.
 * - Advance `step` in the parent when a step validates and submits.
 *
 * @example Faculty add dialog
 * ```tsx
 * import { MultiStepIndicator } from "@/components/common/multi-step-indicator";
 * import { ADD_FACULTY_STEPS } from "@/features/faculty/constants";
 *
 * function AddFacultyDialog({ step }: { step: number }) {
 *   return <MultiStepIndicator step={step} steps={ADD_FACULTY_STEPS} />;
 * }
 * ```
 *
 * @example Student add dialog
 * ```tsx
 * import { MultiStepIndicator } from "@/components/common/multi-step-indicator";
 * import { ADD_STUDENT_STEPS } from "@/features/students/constants";
 *
 * function NewStudentDialog({ step }: { step: number }) {
 *   return <MultiStepIndicator step={step} steps={ADD_STUDENT_STEPS} />;
 * }
 * ```
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type MultiStepIndicatorProps = {
	/** 0-based index of the active step. */
	step: number;
	/** Ordered labels for each step (one entry per step). */
	steps: readonly string[];
	/** Optional wrapper class name. */
	className?: string;
};

export function MultiStepIndicator({
	step,
	steps,
	className,
}: MultiStepIndicatorProps) {
	const totalSteps = steps.length;
	const progress = ((step + 1) / totalSteps) * 100;
	const remaining = totalSteps - step - 1;
	const currentLabel = steps[step] ?? "";

	return (
		<div className={cn("mb-6 space-y-3", className)}>
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium text-foreground">
					Step {step + 1} of {totalSteps} · {currentLabel}
				</span>
				<span className="text-muted-foreground">
					{remaining === 0 ? "Last step" : `${remaining} remaining`}
				</span>
			</div>

			<div className="relative h-1.5 overflow-hidden rounded-full bg-border">
				<motion.div
					className="absolute inset-y-0 left-0 rounded-full bg-primary"
					initial={false}
					animate={{ width: `${progress}%` }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
				/>
			</div>

			<ol className="flex items-center gap-2">
				{steps.map((label, index) => {
					const isActive = index === step;
					const isComplete = index < step;

					return (
						<li key={label} className="flex min-w-0 flex-1 items-center gap-2">
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
									isActive && "bg-primary text-primary-foreground",
									isComplete && "bg-primary/15 text-primary",
									!isActive && !isComplete && "bg-muted text-muted-foreground",
								)}
							>
								{index + 1}
							</span>
							<span
								className={cn(
									"truncate text-xs sm:text-sm",
									isActive && "font-medium text-foreground",
									!isActive && "text-muted-foreground",
								)}
							>
								{label}
							</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
