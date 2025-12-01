// backend/build.js

import { build } from "esbuild";
import { rmSync, mkdirSync, readdirSync, copyFileSync } from "fs";
import path from "path";

// Output folder
const outdir = path.resolve("dist");

// 1. CLEAN OLD BUILD
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

// 2. BUNDLE TYPESCRIPT → LAMBDA COMMONJS
await build({
  entryPoints: ["src/lambda.ts"],
  outfile: "dist/lambda.js",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: false,
  minify: false,

  // Bundle all dependencies EXCEPT Prisma
  external: ["@prisma/client", "prisma"]
});

// 3. COPY PRISMA ARTIFACTS
// We need to reconstruct the node_modules structure for Prisma to work
const cpSync = (src, dest) => {
  copyFileSync(src, dest);
};

// Function to copy directory recursively
import { cpSync as fsCpSync } from "fs";

console.log("Copying Prisma files...");

// Copy generated client
fsCpSync("node_modules/@prisma/client", "dist/node_modules/@prisma/client", { recursive: true });

// Copy .prisma (engines)
fsCpSync("node_modules/.prisma", "dist/node_modules/.prisma", { recursive: true });

console.log("✔ Prisma files copied.");
console.log("✔ Build complete. Lambda ready inside dist/");
