"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ADD_STUDENT_STEPS } from "../constants";

export function AddStudentStepIndicator({ step }: { step: number }) {
	const totalSteps = ADD_STUDENT_STEPS.length;
	const progress = ((step + 1) / totalSteps) * 100;
	const remaining = totalSteps - step - 1;

	return (
		<div className="mb-6 space-y-3">
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium text-foreground">
					Step {step + 1} of {totalSteps} · {ADD_STUDENT_STEPS[step]}
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
				{ADD_STUDENT_STEPS.map((label, index) => {
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
