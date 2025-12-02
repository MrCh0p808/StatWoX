const fs = require('fs-extra');
const path = require('path');
const fs = require('fs-extra');
const path = require('path');

const dist = path.resolve(__dirname, '../dist');
const prismaClient = path.resolve(__dirname, '../node_modules/@prisma/client');
const prismaEngines = path.resolve(__dirname, '../node_modules/.prisma');

(async () => {
    try {
        await fs.copy(prismaClient, path.join(dist, 'node_modules/@prisma/client'));
        if (fs.existsSync(prismaEngines)) {
            await fs.copy(prismaEngines, path.join(dist, 'node_modules/.prisma'));
        }
        console.log('Prisma artifacts copied');
    } catch (err) {
        console.error('Copy failed', err);
        process.exit(1);
    }
})();
