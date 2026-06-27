import type React from "react";
import { cn } from "@/lib/utils";

export default function Container({
	children,
	className,
	...props
}: React.ComponentProps<"main">) {
	return (
		<main
			className={cn(
				"px-6 py-8 lg:px-14 xl:px-28 2xl:px-40 space-y-8",
				className,
			)}
			{...props}
		>
			{children}
		</main>
	);
}
