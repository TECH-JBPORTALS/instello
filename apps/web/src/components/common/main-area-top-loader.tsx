"use client";

import NextTopLoader from "nextjs-toploader";

const MAIN_AREA_TOP_LOADER_COLOR = "#F7941C";

export function MainAreaTopLoader() {
	return (
		<NextTopLoader color={MAIN_AREA_TOP_LOADER_COLOR} showSpinner={false} />
	);
}
