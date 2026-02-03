import 'reflect-metadata';

export const config = {
    port: process.env.PORT || 3002,
    nodeEnv: process.env.NODE_ENV || "development",
    jwtSecret: process.env.JWT_SECRET || "seu-secret-super-seguro",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    databaseUrl: process.env.DATABASE_URL,
};
