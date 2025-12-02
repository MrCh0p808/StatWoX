// backend/scripts/healthcheck.js
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkHealth() {
    console.log('🏥 Starting Health Check...');
    console.log(`Checking Database URL: ${process.env.DATABASE_URL ? 'Set ✅' : 'Missing ❌'}`);

    try {
        console.log('Connecting to Database...');
        await prisma.$connect();
        console.log('✅ Database Connection Successful');

        const result = await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Query Execution Successful:', result);

        console.log('🎉 System is Healthy!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

checkHealth();
