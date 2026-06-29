import type { NextConfig } from "next";

export default {
	transpilePackages: ["@instello/ui", "@instello/convex"],
	allowedDevOrigins: ["localtest.me", "lvh.me", "*.localtest.me", "*.lvh.me"],
} satisfies NextConfig;
