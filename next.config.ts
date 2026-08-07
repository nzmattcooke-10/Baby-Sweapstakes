import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Both of these ship native or WebAssembly assets that resolve their own
   * files at runtime. Bundling them rewrites those paths and they break —
   * PGlite fails to open its data directory, and Argon2 can't find its binding.
   * Marking them external makes Next require() them from node_modules instead.
   */
  serverExternalPackages: ["@electric-sql/pglite", "@node-rs/argon2"],

  /**
   * Pin the workspace root. Without this Turbopack walks up and finds an
   * unrelated package-lock.json in the home directory, and resolves modules
   * against the wrong tree.
   */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
