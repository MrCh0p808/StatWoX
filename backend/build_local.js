import { build } from "esbuild";
import path from "path";

async function bundle() {
    try {
        await build({
            entryPoints: ["src/index.ts"],
            outfile: "dist/server.js",
            bundle: true,
            platform: "node",
            target: "node20",
            format: "cjs",
            sourcemap: true,
            external: ["@prisma/client", "prisma", "express", "cors", "dotenv", "jsonwebtoken", "bcryptjs", "google-auth-library"], // Keep these external to avoid bundling issues, assuming node_modules works for runtime require
        });
        console.log("Build success: dist/server.js");
    } catch (e) {
        console.error("Build failed:", e);
        process.exit(1);
    }
}

bundle();
