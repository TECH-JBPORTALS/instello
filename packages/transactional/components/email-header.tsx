import { Column, Heading, Img, Row, Section } from "react-email";

type EmailHeaderProps = {
	heading?: string;
};

export function EmailHeader({ heading }: EmailHeaderProps) {
	return (
		<Section className="mt-8">
			<Row>
				<Column align="center">
					<Img
						src="https://instello.in/instello-feather.svg"
						alt="Instello"
						width="64"
						height="64"
						className="mx-auto my-0"
					/>
					{heading ? (
						<Heading className="mx-0 mt-6 mb-0 p-0 text-center font-normal text-[24px] text-foreground">
							{heading}
						</Heading>
					) : null}
				</Column>
			</Row>
		</Section>
	);
}
