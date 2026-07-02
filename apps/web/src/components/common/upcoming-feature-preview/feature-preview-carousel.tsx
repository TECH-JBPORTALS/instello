"use client";

import { Button } from "@instello/ui/components/button";
import { cn } from "@instello/ui/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { FeaturePreviewSlide } from "@/lib/feature-previews";

type FeaturePreviewCarouselProps = {
	slides: FeaturePreviewSlide[];
};

export function FeaturePreviewCarousel({
	slides,
}: FeaturePreviewCarouselProps) {
	const [activeIndex, setActiveIndex] = useState(0);
	const slideCount = slides.length;
	const activeSlide = slides[activeIndex];

	const goToPrevious = useCallback(() => {
		setActiveIndex((index) => (index === 0 ? slideCount - 1 : index - 1));
	}, [slideCount]);

	const goToNext = useCallback(() => {
		setActiveIndex((index) => (index === slideCount - 1 ? 0 : index + 1));
	}, [slideCount]);

	useEffect(() => {
		if (slideCount <= 1) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				goToPrevious();
			}
			if (event.key === "ArrowRight") {
				event.preventDefault();
				goToNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [goToNext, goToPrevious, slideCount]);

	if (!activeSlide) return null;

	return (
		<div className="flex flex-col gap-4">
			<div className="relative">
				<div className="relative h-[280px] w-full overflow-hidden rounded-lg border border-border bg-muted/30 sm:h-[320px]">
					<Image
						alt={activeSlide.title}
						className="object-cover object-top"
						fill
						priority
						sizes="(max-width: 672px) 100vw, 672px"
						src={activeSlide.image}
					/>
				</div>

				{slideCount > 1 ? (
					<>
						<Button
							aria-label="Previous slide"
							className="absolute top-1/2 left-2 -translate-y-1/2"
							onClick={goToPrevious}
							size="icon-sm"
							type="button"
						>
							<IconChevronLeft />
						</Button>
						<Button
							aria-label="Next slide"
							className="absolute top-1/2 right-2 -translate-y-1/2"
							onClick={goToNext}
							size="icon-sm"
							type="button"
						>
							<IconChevronRight />
						</Button>
					</>
				) : null}
			</div>

			<div className="flex min-h-18 flex-col gap-1.5 text-center">
				<h3 className="font-heading text-base font-medium text-foreground">
					{activeSlide.title}
				</h3>
				<p className="text-sm text-muted-foreground text-balance">
					{activeSlide.description}
				</p>
			</div>

			{slideCount > 1 ? (
				<div
					aria-label="Slide navigation"
					className="flex items-center justify-center gap-2"
					role="tablist"
				>
					{slides.map((slide, index) => (
						<button
							aria-current={index === activeIndex ? "true" : undefined}
							aria-label={`Go to slide ${index + 1}: ${slide.title}`}
							className={cn(
								"size-2 rounded-full transition-colors",
								index === activeIndex
									? "bg-foreground"
									: "bg-muted-foreground/30 hover:bg-muted-foreground/50",
							)}
							key={`${slide.image}-${index}`}
							onClick={() => setActiveIndex(index)}
							role="tab"
							type="button"
						/>
					))}
				</div>
			) : null}
		</div>
	);
}
