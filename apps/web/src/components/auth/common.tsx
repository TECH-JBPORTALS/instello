import Image from "next/image";
import type React from "react";

export function AuthShell({ children }: { children: React.ReactNode }) {
	return (
		<section className="px-4 flex flex-col h-svh items-center justify-center gap-14">
			<Image
				src={"/instello.svg"}
				height={60}
				width={120}
				alt="Instello Logo"
			/>
			{children}
		</section>
	);
}
