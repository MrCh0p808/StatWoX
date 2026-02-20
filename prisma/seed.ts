import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Hash the password 'Demo1234'
    const hashedPassword = await bcrypt.hash('Demo1234', 12);

    // Create Demo User
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@statwox.com' },
        update: {},
        create: {
            email: 'demo@statwox.com',
            name: 'Demo User',
            username: 'demo_user',
            passwordHash: hashedPassword,
            bio: 'This is a demo account for StatWoX.',
        },
    });

    console.log(`👤 Created Demo User: ${demoUser.email}`);

    // Create a Sample Survey for the Demo User
    const sampleSurvey = await prisma.survey.upsert({
        where: { id: 'demo-survey-1' },
        update: {},
        create: {
            id: 'demo-survey-1',
            title: 'Customer Satisfaction Survey 2026',
            description: 'Help us improve our services by providing your valuable feedback.',
            status: 'published',
            isPublic: true,
            authorId: demoUser.id,
            category: 'survey',
            questions: {
                create: [
                    {
                        title: 'How satisfied are you with our product?',
                        type: 'rating',
                        required: true,
                        order: 0,
                    },
                    {
                        title: 'What features would you like to see in the future?',
                        type: 'longText',
                        required: false,
                        order: 1,
                    },
                ],
            },
        },
    });

    console.log(`📊 Created Sample Survey: ${sampleSurvey.title}`);
    console.log('✅ Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
