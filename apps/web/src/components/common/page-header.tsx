"use client";

import type React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
	className,
	...props
}: React.ComponentProps<"header">) {
	return (
		<header className={cn("h-14 flex justify-between", className)} {...props} />
	);
}

export function PageHeaderStart({
	className,
	...props
}: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col", className)} {...props} />;
}

export function PageHeaderEnd({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex h-auto w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center",
				className,
			)}
			{...props}
		/>
	);
}

export function PageHeaderTitle({
	className,
	...props
}: React.ComponentProps<"h3">) {
	return <h3 className={cn("text-2xl font-semibold", className)} {...props} />;
}

export function PageHeaderDescription({
	className,
	...props
}: React.ComponentProps<"p">) {
	return (
		<p className={cn("text-sm text-muted-foreground", className)} {...props} />
	);
}
