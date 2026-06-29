import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Skeleton } from "@instello/ui/components/skeleton";

type InstitutionPreviewValues = {
	basicInfo: {
		logo: string;
		name: string;
		code: string;
		slug: string;
	};
	address: {
		addressLine: string;
		district: string;
		state: string;
		zipCode: string;
	};
};

export function InstitutionPreview({
	values,
}: {
	values: InstitutionPreviewValues;
}) {
	const { basicInfo, address } = values;
	const addressLine = formatInstitutionAddress(address);

	return (
		<div className="flex h-full flex-col overflow-y-auto p-4">
			<div className="rounded-xl border bg-background p-4 shadow-xs">
				<div className="flex items-start gap-3">
					<Avatar size="lg" className="rounded-lg after:rounded-lg">
						{basicInfo.logo ? (
							<AvatarImage
								src={basicInfo.logo}
								alt={basicInfo.name || "Institution logo"}
								className="rounded-lg"
							/>
						) : null}
						<AvatarFallback className="rounded-lg font-semibold">
							{getInstitutionInitials(basicInfo.name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 space-y-1">
						{basicInfo.name.trim() ? (
							<p className="truncate font-semibold text-foreground">
								{basicInfo.name}
							</p>
						) : (
							<Skeleton className="h-4 w-3/5 animate-none" />
						)}
						{basicInfo.code.trim() ? (
							<p className="text-sm text-muted-foreground">{basicInfo.code}</p>
						) : (
							<Skeleton className="h-3.5 w-12 animate-none" />
						)}
						{addressLine ? (
							<p className="line-clamp-2 text-xs text-muted-foreground">
								{addressLine}
							</p>
						) : null}
					</div>
				</div>
			</div>

			<div className="mt-4 flex-1 rounded-xl border bg-card overflow-hidden shadow-xs">
				<PreviewSkeletonRow />
				<PreviewSkeletonRow />
				<PreviewSkeletonRow />
				<PreviewSkeletonRow />
			</div>
		</div>
	);
}

function PreviewSkeletonRow() {
	return (
		<div className="flex items-center gap-3  border-b border-border p-4 last:border-b-0 last:pb-0">
			<Skeleton className="size-9 shrink-0 rounded-lg animate-none" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-3.5 w-4/5 animate-none" />
				<Skeleton className="h-3 w-2/5 animate-none" />
			</div>
		</div>
	);
}

function getInstitutionInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "?";
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return (words[0][0] + words[1][0]).toUpperCase();
}

function formatInstitutionAddress(
	address: InstitutionPreviewValues["address"],
) {
	const parts = [
		address.addressLine.trim(),
		address.district.trim(),
		address.state.trim(),
	].filter(Boolean);

	if (parts.length === 0 && !address.zipCode.trim()) return "";

	const location = parts.join(", ");
	const zip = address.zipCode.trim();

	if (location && zip) return `${location} - ${zip}`;
	return location || zip;
}

export function getInstitutionPreviewUrl(slug: string) {
	const trimmedSlug = slug.trim() || "app";
	return `${trimmedSlug}.instello.in`;
}
