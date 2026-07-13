"use client";

import { Tabs, TabsList, TabsTrigger } from "@instello/ui/components/tabs";

export function FacultyStatusTabs({
	value,
	onChange,
}: {
	value: "active" | "inactive";
	onChange: (value: "active" | "inactive") => void;
}) {
	return (
		<Tabs
			value={value}
			onValueChange={(nextValue) =>
				onChange(nextValue as "active" | "inactive")
			}
		>
			<TabsList>
				<TabsTrigger value="active">Active</TabsTrigger>
				<TabsTrigger value="inactive">Inactive</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
