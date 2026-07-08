import type { ColorSchemePreview } from "./theme-config";

type ColorSchemeSwatchProps = {
	preview: ColorSchemePreview;
	className?: string;
};

export function ColorSchemeSwatch({
	preview,
	className,
}: ColorSchemeSwatchProps) {
	return (
		<span
			className={className}
			aria-hidden
			style={{
				display: "inline-flex",
				width: "2.25rem",
				height: "1.25rem",
				borderRadius: "0.375rem",
				overflow: "hidden",
				border: "1px solid oklch(0.85 0.01 250 / 0.5)",
				flexShrink: 0,
			}}
		>
			<span style={{ flex: 1, background: preview.background }} />
			<span style={{ flex: 1, background: preview.primary }} />
			<span style={{ flex: 1, background: preview.foreground }} />
		</span>
	);
}
