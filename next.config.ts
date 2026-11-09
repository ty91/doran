import type { NextConfig } from "next";
import { basePath } from "./src/lib/base-path";

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  basePath,
  reactCompiler: true,
  allowedDevOrigins,
};

export default nextConfig;
