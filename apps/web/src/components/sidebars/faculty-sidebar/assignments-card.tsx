import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import { IconClipboardList } from "@tabler/icons-react";

export function FacultyAssignmentsCard() {
	return (
		<div className="px-2 pb-2">
			<Empty className="gap-2!">
				<EmptyMedia variant="icon">
					<IconClipboardList className="size-4" />
				</EmptyMedia>
				<EmptyHeader className="gap-0!">
					<EmptyTitle className="text-sm!">No assignments</EmptyTitle>
					<EmptyDescription className="text-xs!">
						Your adminstrator will assign assignments to you soon.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	);
}
