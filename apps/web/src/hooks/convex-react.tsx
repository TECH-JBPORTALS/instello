"use client";

import {
	type PaginatedQueryArgs,
	type PaginatedQueryReference,
	type UsePaginatedQueryReturnType,
	useMutation as useConvexMutation,
} from "convex/react";
import type {
	FunctionArgs,
	FunctionReference,
	FunctionReturnType,
} from "convex/server";
import type { BetterOmit } from "convex-helpers";
import {
	usePaginatedQuery as useCachedPaginatedQuery,
	useQuery as useCachedQuery,
} from "convex-helpers/react/cache/hooks";
import { useParams } from "next/navigation";
import { useCallback } from "react";

type WithoutSlug<T> = T extends { slug: string } ? BetterOmit<T, "slug"> : T;
type InsArgs<T> = WithoutSlug<T> | "skip";

function withInsSlug<T extends { slug: string }>(
	slug: string | undefined,
	args: InsArgs<T> | undefined,
): T | "skip" {
	if (args === "skip" || !slug) return "skip";
	return { ...(args ?? {}), slug } as T;
}

/** Returns the institution slug from the URL */
export function useInstitutionSlug() {
	const { subdomain } = useParams<{ subdomain: string }>();
	return subdomain;
}

/** Resolves the slug and args and returns the query result */
export function useInsQuery<Query extends FunctionReference<"query">>(
	query: Query,
	args?: InsArgs<FunctionArgs<Query>>,
): FunctionReturnType<Query> | undefined {
	const slug = useInstitutionSlug();
	return useCachedQuery(query, withInsSlug(slug, args));
}

/** Resolves the slug and args and returns the paginated query result */
export function useInsPaginatedQuery<Query extends PaginatedQueryReference>(
	query: Query,
	args: InsArgs<PaginatedQueryArgs<Query>> | "skip",
	options: { initialNumItems: number },
): UsePaginatedQueryReturnType<Query> {
	const slug = useInstitutionSlug();

	return useCachedPaginatedQuery(
		query,
		withInsSlug(slug, args) as PaginatedQueryArgs<Query> | "skip",
		options,
	);
}

/** Resolves the slug and args and returns the mutation result */
export function useInsMutation<Mutation extends FunctionReference<"mutation">>(
	mutation: Mutation,
) {
	const slug = useInstitutionSlug();
	const mutate = useConvexMutation(mutation);

	return useCallback(
		(args: WithoutSlug<FunctionArgs<Mutation>>) => {
			if (!slug) {
				throw new Error(
					"Institution slug is required. useInsMutation must be used within /ins/[subdomain] routes.",
				);
			}

			return mutate({ ...(args ?? {}), slug } as FunctionArgs<Mutation>);
		},
		[mutate, slug],
	);
}
