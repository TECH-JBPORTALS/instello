"use client";

import { useSyncActiveInstitution } from "@/hooks/use-sync-active-institution";

export function SyncActiveInstitution() {
	useSyncActiveInstitution();
	return null;
}
