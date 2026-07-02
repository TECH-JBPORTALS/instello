"use client";

import {
	ColorPicker,
	ColorPickerArea,
	ColorPickerContent,
	ColorPickerInput,
	ColorPickerTrigger,
} from "@instello/ui/components/color-picker";
import { cn } from "@instello/ui/lib/utils";
import { IconPalette } from "@tabler/icons-react";
import { isPresetSubjectColor, SUBJECT_COLOR_PALETTE } from "../constants";

export function SubjectColorField({
	value,
	onChange,
}: {
	value: string;
	onChange: (color: string) => void;
}) {
	const isCustom = !isPresetSubjectColor(value);

	return (
		<ColorPicker value={value} onChange={onChange}>
			<div className="flex flex-wrap gap-x-2 gap-y-2">
				{SUBJECT_COLOR_PALETTE.map((option) => (
					<button
						key={option.value}
						type="button"
						aria-label={option.label}
						className={cn(
							"size-8 rounded-lg border-2 transition-transform hover:scale-105",
							value.toLowerCase() === option.value.toLowerCase()
								? "border-foreground scale-105"
								: "border-transparent",
						)}
						style={{ backgroundColor: option.value }}
						onClick={() => onChange(option.value)}
					/>
				))}
				<ColorPickerTrigger
					aria-label="Custom color"
					className={cn(
						"flex size-8 items-center justify-center rounded-lg border-2 transition-transform hover:scale-105",
						isCustom
							? "border-foreground scale-105"
							: "border-dashed border-muted-foreground/40",
					)}
					style={isCustom ? { backgroundColor: value } : undefined}
				>
					{!isCustom && (
						<IconPalette className="size-4 text-muted-foreground" />
					)}
				</ColorPickerTrigger>
			</div>
			<ColorPickerContent align="start">
				<ColorPickerArea />
				<ColorPickerInput aria-label="Hex color value" />
			</ColorPickerContent>
		</ColorPicker>
	);
}
