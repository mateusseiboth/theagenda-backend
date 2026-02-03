import "reflect-metadata";
import { execSync } from "child_process";
import cors from "cors";
import express from "express";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { config } from "./config";
import prismaClient from "./database/prisma";
import routes from "./http/routes";
import { CronService } from "./services/CronService";
import { WhatsAppService } from "./services/WhatsAppService";


global._console = console.log;

// Limpar processos e lockfiles do WhatsApp ANTES de qualquer coisa
const cleanupWhatsAppLocks = () => {
    try {
        // Matar processos do Chromium relacionados ao WhatsApp
        try {
            execSync('pkill -9 -f "whatsapp-session"', { stdio: 'ignore' });
            console.log('🧹 Processos do WhatsApp encerrados');
        } catch (error) {
            // Ignorar erro se não houver processos para matar
        }

        // Remover lockfiles
        const sessionPath = './whatsapp-session/session';
        const locks = ['SingletonLock', 'lockfile'];

        locks.forEach(lockFile => {
            const lockPath = join(sessionPath, lockFile);
            if (existsSync(lockPath)) {
                unlinkSync(lockPath);
                console.log(`🧹 ${lockFile} removido`);
            }
        });
    } catch (error) {
        console.warn('⚠️  Erro ao limpar lockfiles:', error);
    }
};

// Executar limpeza imediatamente
cleanupWhatsAppLocks();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use(routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada" });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Erro:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
});

// Start server
const startServer = async () => {
    try {
        await prismaClient.$connect();
        console.log("✅ Conectado ao banco de dados");

        app.listen(config.port, () => {
            console.log(`🚀 Servidor rodando na porta ${config.port}`);
            console.log(`📝 Ambiente: ${config.nodeEnv}`);
            console.log(`🔗 http://localhost:${config.port}`);

            // Inicializar WhatsApp automaticamente
            console.log('\n📱 Inicializando WhatsApp...');
            const whatsappService = WhatsAppService.getInstance();
            whatsappService.initialize().catch(err => {
                console.error('❌ Erro ao inicializar WhatsApp:', err);
            });

            // Iniciar cron jobs
            const cronService = CronService.getInstance();
            cronService.start();
        });
    } catch (error) {
        console.error("❌ Erro ao iniciar servidor:", error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Recebido sinal ${signal}, encerrando servidor...`);

    try {
        // Encerrar WhatsApp
        const whatsappService = WhatsAppService.getInstance();
        await whatsappService.disconnect();

        // Parar cron jobs
        const cronService = CronService.getInstance();
        cronService.stop();

        // Desconectar banco de dados
        await prismaClient.$disconnect();

        console.log("✅ Servidor encerrado com sucesso");
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao encerrar servidor:", error);
        process.exit(1);
    }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // nodemon restart

export default app;
