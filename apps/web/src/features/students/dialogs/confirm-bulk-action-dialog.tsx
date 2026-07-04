"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
import { Button } from "@instello/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@instello/ui/components/dialog";
import { Spinner } from "@instello/ui/components/spinner";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { StudentAvatar } from "../student-avatar";

const MAX_VISIBLE_AVATARS = 5;

type ConfirmBulkActionStudent = {
	_id: string;
	firstName: string;
	lastName: string;
	image?: string;
};

type ConfirmBulkActionDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	students: ConfirmBulkActionStudent[];
	onConfirm: () => Promise<void>;
};

export function ConfirmBulkActionDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	students,
	onConfirm,
}: ConfirmBulkActionDialogProps) {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) setError(null);
	}, [open]);

	const visibleStudents = students.slice(0, MAX_VISIBLE_AVATARS);
	const overflowCount = students.length - visibleStudents.length;

	async function handleConfirm() {
		setIsPending(true);
		setError(null);

		try {
			await onConfirm();
			onOpenChange(false);
		} catch (thrownError) {
			setError(
				getConvexErrorMessage(thrownError, "Something went wrong. Try again."),
			);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => !isPending && onOpenChange(next)}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="flex -space-x-2">
					{visibleStudents.map((student) => (
						<StudentAvatar
							key={student._id}
							firstName={student.firstName}
							lastName={student.lastName}
							image={student.image}
							size="sm"
						/>
					))}
					{overflowCount > 0 && (
						<div className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background">
							+{overflowCount}
						</div>
					)}
				</div>

				{error && (
					<Alert variant="destructive">
						<IconAlertCircle />
						<AlertTitle>Could not complete action</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleConfirm} disabled={isPending}>
						{isPending && <Spinner />}
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
