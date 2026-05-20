import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { UserRole } from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL as string;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminPassword = await argon2.hash('master@2026');
    const staffPassword = await argon2.hash('master@2026');

    const adminUser = await prisma.user.upsert({
        where: { userName: 'admin' },
        update: {},
        create: {
            userName: 'admin',
            email: 'admin@example.com',
            password: adminPassword,
            role: UserRole.ADMIN,
        },
    });

    const staffUser = await prisma.user.upsert({
        where: { userName: 'staff' },
        update: {},
        create: {
            userName: 'staff',
            email: 'staff@example.com',
            password: staffPassword,
            role: UserRole.STAFF,
        },
    });

    console.log('✅ Seed concluído com sucesso');
    console.log('Admin user:', adminUser);
    console.log('Staff user:', staffUser);
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
