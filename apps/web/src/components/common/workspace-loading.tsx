import Image from "next/image";

export function WorkspaceLoading() {
	return (
		<div className="flex flex-col items-center justify-center gap-4">
			<Image
				src={"/instello-feather.svg"}
				height={82}
				width={82}
				alt="Instello Feather"
				className="mr-8 rotate-8"
			/>
			<h1 className="font-semibold">Loading your workspace...</h1>
		</div>
	);
}
