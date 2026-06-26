import type { NextConfig } from "next";

export default {
	transpilePackages: ["@instello/ui", "@instello/backend"],
	allowedDevOrigins: ["localtest.me", "lvh.me", "*.localtest.me", "*.lvh.me"],
} satisfies NextConfig;
