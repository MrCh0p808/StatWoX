import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("1. Starting Diagnostic Check (JS Mode)...");
    console.log("2. Attempting to connect to Database...");

    try {
        // Set a timeout for the connection attempt
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database connection timed out after 5s')), 5000)
        );

        const connectionPromise = prisma.$connect();

        await Promise.race([connectionPromise, timeoutPromise]);
        console.log("3. Database Connection: SUCCESS ✅");

        console.log("4. Attempting simple query (Count Users)...");
        const userCount = await prisma.user.count();
        console.log(`5. Query Successful. User count: ${userCount} ✅`);

    } catch (e) {
        console.error("❌ DIAGNOSTIC FAILED ❌");
        console.error("Error:", e.message);
        console.error("---------------------------------------------------");
        console.error("POSSIBLE CAUSES:");
        console.error("1. PostgreSQL is not running. Try: `sudo service postgresql start`");
        console.error("2. Credentials in .env are wrong.");
        console.error("3. Firewall/Port 5432 is blocked.");
    } finally {
        await prisma.$disconnect();
    }
}

main();
