import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// I wrote this script to make sure the prisma binaries actually get copied to the dist folder because the build process misses them sometimes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dist = path.resolve(__dirname, '../dist');
const prismaClient = path.resolve(__dirname, '../node_modules/@prisma/client');
const prismaEngines = path.resolve(__dirname, '../node_modules/.prisma');

(async () => {
    try {
        await fs.cp(prismaClient, path.join(dist, 'node_modules/@prisma/client'), { recursive: true });
        if (existsSync(prismaEngines)) {
            await fs.cp(prismaEngines, path.join(dist, 'node_modules/.prisma'), { recursive: true });
        }
        console.log('Prisma artifacts copied');
    } catch (err) {
        console.error('Copy failed', err);
        process.exit(1);
    }
})();
