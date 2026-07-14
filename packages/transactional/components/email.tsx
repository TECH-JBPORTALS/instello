import type { ReactNode } from "react";
import {
	Body,
	Container,
	Font,
	Head,
	Html,
	Preview,
	Tailwind,
} from "react-email";
import { emailFontFamily, emailFontWeb, emailTailwindConfig } from "../theme";

type EmailProps = {
	preview: string;
	children: ReactNode;
};

export function Email({ preview, children }: EmailProps) {
	return (
		<Html>
			<Head>
				<Font
					fontFamily={emailFontFamily}
					fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
					webFont={emailFontWeb}
					fontWeight={400}
					fontStyle="normal"
				/>
			</Head>
			<Preview>{preview}</Preview>
			<Tailwind config={emailTailwindConfig}>
				<Body className="mx-auto my-auto bg-background px-2 font-sans text-foreground">
					<Container className="mx-auto my-10 max-w-[465px] rounded-lg border border-solid border-border bg-background p-5">
						{children}
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
