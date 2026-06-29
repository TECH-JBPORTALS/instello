"use client";

import {
	IconChevronLeft,
	IconChevronRight,
	IconDotsVertical,
	IconLockFilled,
	IconReload,
} from "@tabler/icons-react";
import type React from "react";
import { cn } from "../lib/utils";

export function BrowserMockup({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex h-[520px] w-[480px] shrink-0 flex-col overflow-hidden rounded-l-xl border border-r-0",
				className,
			)}
			{...props}
		/>
	);
}

export function BrowserMockupHeader({
	className,
	searchInputText,
	...props
}: Omit<React.ComponentProps<"div">, "children"> & {
	searchInputText?: string;
}) {
	return (
		<div
			className={cn("h-12 px-4 border-b flex gap-4 items-center", className)}
			{...props}
		>
			<div className="flex gap-2.5 [&>svg]:size-4 [&>svg]:text-muted-foreground">
				<IconChevronLeft />
				<IconChevronRight />
				<IconReload />
			</div>

			<div className="flex items-center px-2 overflow-hidden border w-full text-xs rounded-full bg-accent/50 h-8 gap-2 [&>svg]:size-4 [&>svg]:text-muted-foreground">
				<IconLockFilled />
				<span className="truncate">
					{searchInputText ?? "Ask Google or Type a URL"}
				</span>
			</div>

			<div className="flex gap-2.5 [&>svg]:size-4 [&>svg]:text-muted-foreground">
				<IconDotsVertical />
			</div>
		</div>
	);
}

export function BrowserMockupContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"min-h-0 w-full flex-1 overflow-hidden bg-accent/30",
				className,
			)}
			{...props}
		/>
	);
}
