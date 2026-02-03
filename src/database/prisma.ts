import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});
const prismaClient = new PrismaClient({
    adapter,
    log: ["warn", "error"],
    transactionOptions: {
        maxWait: 1500000,
        timeout: 1500000,
    },
});



export default prismaClient;
