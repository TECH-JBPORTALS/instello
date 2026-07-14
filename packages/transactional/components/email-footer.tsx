import { Column, Row, Section, Text } from "react-email";

export function EmailFooter() {
	return (
		<Section className="mt-8">
			<Row>
				<Column align="center">
					<Text className="text-muted-foreground">
						© 2026 Instello. All rights reserved.
					</Text>
				</Column>
			</Row>
		</Section>
	);
}
