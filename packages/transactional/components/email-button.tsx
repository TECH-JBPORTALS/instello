import type { ReactNode } from "react";
import { Button } from "react-email";

type EmailButtonProps = {
	href: string;
	children: ReactNode;
};

export function EmailButton({ href, children }: EmailButtonProps) {
	return (
		<Button
			href={href}
			className={
				"rounded-md bg-primary px-5 py-3 text-center font-semibold text-[16px] w-1/2 text-primary-foreground no-underline"
			}
		>
			{children}
		</Button>
	);
}
