"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ImportProgressHeaderProps = {
	label: string;
	current: number;
	total: number;
	className?: string;
};

export function ImportProgressHeader({
	label,
	current,
	total,
	className,
}: ImportProgressHeaderProps) {
	const percent = total > 0 ? Math.round((current / total) * 100) : 0;

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium">{label}</span>
				<span className="text-muted-foreground">
					{current} / {total}
				</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-muted">
				<motion.div
					className="h-full rounded-full bg-primary"
					initial={{ width: 0 }}
					animate={{ width: `${percent}%` }}
					transition={{ type: "spring", stiffness: 120, damping: 20 }}
				/>
			</div>
		</div>
	);
}
