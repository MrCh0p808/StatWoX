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

  // DO NOT bundle node_modules deps
  external: [
    "express",
    "cors",
    "serverless-http",
    "jsonwebtoken",
    "bcryptjs",
    "axios",
    "@prisma/client",
    "prisma"
  ]
});

// 3. COPY PRISMA ENGINE (find correct one automatically)
const prismaClientDir = "./node_modules/.prisma/client";
const files = readdirSync(prismaClientDir);

// Look for engine file that ends with .so.node
const engineFile = files.find(f => f.endsWith(".so.node"));

if (!engineFile) {
  throw new Error("[BUILD ERROR] Could not find Prisma engine (.so.node) in .prisma/client");
}

copyFileSync(
  `${prismaClientDir}/${engineFile}`,
  `./dist/${engineFile}`
);

console.log("✔ Prisma engine copied:", engineFile);
console.log("✔ Build complete. Lambda ready inside dist/");
