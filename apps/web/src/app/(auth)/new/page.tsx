import Image from "next/image";
import Container from "@/components/common/container";
import { NewInstitutionForm } from "@/components/institution/new-institution-form";

export default function NewInstitutionPage() {
	return (
		<Container className="items-center h-svh flex-col gap-1.5 flex w-full justify-center">
			<Image
				src={"/instello.svg"}
				alt="instello-logo"
				width={140}
				height={52}
			/>
			<NewInstitutionForm />
		</Container>
	);
}
