import * as argon2 from "argon2";
import { ConfigDAO } from "./DAO/ConfigDAO";
import { SpecialtyDAO } from "./DAO/SpecialtyDAO";
import { UserDAO } from "./DAO/UserDAO";
import prismaClient from "./database/prisma";
import { ConfigModel } from "./model/ConfigModel";
import { SpecialtyModel } from "./model/SpecialtyModel";
import { UserModel } from "./model/UserModel";

async function bootstrap() {
    await prismaClient.$connect();
    console.log("🚀 Iniciando bootstrap do sistema de agendamento...");

    await prismaClient.$transaction(async (tx) => {
        // 1️⃣ Criar configuração padrão
        const configDao = new ConfigDAO();
        configDao.init(tx);

        const configExists = await configDao.get();
        if (!configExists) {
            const configModel = new ConfigModel({
                workStartHour: 8,
                workEndHour: 18,
                workDays: [1, 2, 3, 4, 5], // Segunda a Sexta
                slotDuration: 30,
                maxAdvanceDays: 30,
                allowCancellation: true,
                cancellationHours: 24,
            } as ConfigModel);

            await configDao.create(configModel);
            console.log("✅ Configuração padrão criada.");
        } else {
            console.log("ℹ️  Configuração já existe.");
        }

        // 2️⃣ Criar usuário admin
        const adminPhone = process.env.ADMIN_PHONE || "+5511999999999";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        const userDao = new UserDAO();
        userDao.init(tx);

        const adminExists = await userDao.getByPhone(adminPhone);

        if (!adminExists) {
            const hashedPassword = await argon2.hash(adminPassword);
            const userModel = new UserModel({
                phone: adminPhone,
                name: "Administrador",
                password: hashedPassword,
                role: 'ADMIN',
            } as UserModel);

            await userDao.create(userModel);
            console.log("✅ Usuário admin criado.");
            console.log(`   Telefone: ${adminPhone}`);
            console.log(`   Senha: ${adminPassword}`);
        } else {
            console.log("ℹ️  Usuário admin já existe.");
        }

        // 3️⃣ Criar especialidades de exemplo
        const specialtyDao = new SpecialtyDAO();
        specialtyDao.init(tx);

        const existingSpecialties = await tx.specialty.findMany({ take: 1 });

        if (existingSpecialties.length === 0) {
            const specialties = [
                {
                    name: "Corte de Cabelo",
                    description: "Corte de cabelo masculino ou feminino",
                    avgDuration: 30,
                    price: 50.0,
                    maxSimultaneous: 2,
                },
                {
                    name: "Escova",
                    description: "Escova progressiva ou modeladora",
                    avgDuration: 60,
                    price: 80.0,
                    maxSimultaneous: 2,
                },
                {
                    name: "Manicure",
                    description: "Serviço de manicure completo",
                    avgDuration: 45,
                    price: 35.0,
                    maxSimultaneous: 3,
                },
                {
                    name: "Design de Sobrancelhas",
                    description: "Design e modelagem de sobrancelhas",
                    avgDuration: 30,
                    price: 40.0,
                    maxSimultaneous: 1,
                },
            ];

            for (const specialty of specialties) {
                const specialtyModel = new SpecialtyModel({
                    name: specialty.name,
                    description: specialty.description,
                    avgDuration: specialty.avgDuration,
                    price: specialty.price,
                    maxSimultaneous: specialty.maxSimultaneous,
                } as SpecialtyModel);

                await specialtyDao.create(specialtyModel);
            }

            console.log("✅ Especialidades de exemplo criadas.");
        } else {
            console.log("ℹ️  Especialidades já existem.");
        }
    });

    console.log("✅ Bootstrap concluído com sucesso!");
    await prismaClient.$disconnect();
}

bootstrap().catch((error) => {
    console.error("❌ Erro no bootstrap:", error);
    process.exit(1);
});

