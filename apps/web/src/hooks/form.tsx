import { Button } from "@instello/ui/components/button";
import { Input } from "@instello/ui/components/input";
import { Textarea } from "@instello/ui/components/textarea";
import { createFormHook } from "@tanstack/react-form-nextjs";
import { fieldContext, formContext, useFormContext } from "./form-context";

function SubscribeButton({ label }: { label: string }) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button type="submit" disabled={isSubmitting}>
					{label}
				</Button>
			)}
		</form.Subscribe>
	);
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldComponents: {
		Input,
		Textarea,
	},
	formComponents: {
		SubscribeButton,
	},
	fieldContext,
	formContext,
});
