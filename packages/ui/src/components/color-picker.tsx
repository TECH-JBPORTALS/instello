"use client";

import { Input } from "@instello/ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@instello/ui/components/popover";
import { cn } from "@instello/ui/lib/utils";
import {
	type ComponentProps,
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { HexColorPicker } from "react-colorful";

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

type ColorPickerContextValue = {
	value: string;
	onChange: (color: string) => void;
	open: boolean;
	setOpen: (open: boolean) => void;
};

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

function useColorPickerContext() {
	const context = useContext(ColorPickerContext);
	if (!context) {
		throw new Error("ColorPicker components must be used within ColorPicker");
	}
	return context;
}

export function normalizeHexColor(color: string): string | null {
	const trimmed = color.trim();
	if (!HEX_COLOR_REGEX.test(trimmed)) return null;

	if (trimmed.length === 4) {
		const [, r, g, b] = trimmed;
		return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
	}

	return trimmed.toUpperCase();
}

function ColorPicker({
	value,
	onChange,
	open: openProp,
	onOpenChange,
	defaultOpen = false,
	children,
}: {
	value: string;
	onChange: (color: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	defaultOpen?: boolean;
	children: ReactNode;
}) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
	const open = openProp ?? uncontrolledOpen;

	const setOpen = useCallback(
		(nextOpen: boolean) => {
			onOpenChange?.(nextOpen);
			if (openProp === undefined) {
				setUncontrolledOpen(nextOpen);
			}
		},
		[onOpenChange, openProp],
	);

	const contextValue = useMemo(
		() => ({
			value,
			onChange,
			open,
			setOpen,
		}),
		[value, onChange, open, setOpen],
	);

	return (
		<ColorPickerContext.Provider value={contextValue}>
			<Popover open={open} onOpenChange={setOpen}>
				{children}
			</Popover>
		</ColorPickerContext.Provider>
	);
}

function ColorPickerTrigger({
	className,
	children,
	...props
}: ComponentProps<typeof PopoverTrigger>) {
	return (
		<PopoverTrigger
			data-slot="color-picker-trigger"
			className={cn("inline-flex", className)}
			{...props}
		>
			{children}
		</PopoverTrigger>
	);
}

function ColorPickerSwatch({ className, ...props }: ComponentProps<"button">) {
	const { value } = useColorPickerContext();

	return (
		<button
			type="button"
			data-slot="color-picker-swatch"
			className={cn(
				"size-8 rounded-lg border-2 border-transparent transition-transform hover:scale-105 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
				className,
			)}
			style={{ backgroundColor: value }}
			{...props}
		/>
	);
}

function ColorPickerContent({
	className,
	...props
}: ComponentProps<typeof PopoverContent>) {
	return (
		<PopoverContent
			data-slot="color-picker-content"
			className={cn("w-64 gap-3 p-3", className)}
			{...props}
		/>
	);
}

function ColorPickerArea({ className, ...props }: ComponentProps<"div">) {
	const { value, onChange } = useColorPickerContext();

	return (
		<div
			data-slot="color-picker-area"
			className={cn(
				"[&_.react-colorful]:h-40 [&_.react-colorful]:w-full [&_.react-colorful__hue]:h-3 w-full [&_.react-colorful__hue]:rounded-full [&_.react-colorful__pointer]:size-4 [&_.react-colorful__saturation]:rounded-lg [&_.react-colorful__saturation]:border [&_.react-colorful__saturation]:border-border",
				className,
			)}
			{...props}
		>
			<HexColorPicker
				color={value}
				onChange={onChange}
				className="flex-1 w-full!"
			/>
		</div>
	);
}

function ColorPickerInput({
	className,
	...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange">) {
	const { value, onChange } = useColorPickerContext();
	const [inputValue, setInputValue] = useState(value);

	useEffect(() => {
		setInputValue(value);
	}, [value]);

	const commitInput = useCallback(
		(nextValue: string) => {
			const normalized = normalizeHexColor(nextValue);
			if (normalized) {
				onChange(normalized);
				setInputValue(normalized);
				return;
			}

			setInputValue(value);
		},
		[onChange, value],
	);

	return (
		<Input
			data-slot="color-picker-input"
			value={inputValue}
			onChange={(event) => setInputValue(event.target.value)}
			onBlur={() => commitInput(inputValue)}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					commitInput(inputValue);
				}
			}}
			placeholder="#000000"
			spellCheck={false}
			autoComplete="off"
			className={cn("font-mono uppercase", className)}
			{...props}
		/>
	);
}

export {
	ColorPicker,
	ColorPickerArea,
	ColorPickerContent,
	ColorPickerInput,
	ColorPickerSwatch,
	ColorPickerTrigger,
};
