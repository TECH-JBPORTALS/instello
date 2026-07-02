"use client";

import { Badge } from "@instello/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import type {
	FeaturePreviewKey,
	FeaturePreviewScope,
	FeaturePreviewSlide,
} from "@/lib/feature-previews";
import { FeaturePreviewCarousel } from "./feature-preview-carousel";

type UpcomingFeaturePreviewProps = {
	featureKey: FeaturePreviewKey;
	scope: FeaturePreviewScope;
	featureTitle: string;
	slides: FeaturePreviewSlide[];
};

export function UpcomingFeaturePreview({
	featureTitle,
	slides,
}: UpcomingFeaturePreviewProps) {
	return (
		<section
			aria-label="Upcoming feature preview"
			className="absolute inset-0 z-10"
		>
			<div
				aria-hidden
				className="absolute inset-0 bg-background/20 backdrop-blur-xs"
			/>

			<div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
				<Card className="w-full max-w-2xl shadow-lg">
					<CardHeader className="items-center text-center">
						<Badge className="w-fit" variant="secondary">
							Coming soon
						</Badge>
						<CardTitle>{featureTitle}</CardTitle>
						<CardDescription>
							A preview of what is coming to Instello.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FeaturePreviewCarousel slides={slides} />
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
