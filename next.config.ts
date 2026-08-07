import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Argon2 ships a native binding. Keeping it external lets Node load the
   * correct binary in Firebase App Hosting's Cloud Run container.
   */
  serverExternalPackages: ["@node-rs/argon2"],

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
