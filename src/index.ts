import "reflect-metadata";
import cors from "cors";
import express from "express";
import { config } from "./config";
import prismaClient from "./database/prisma";
import routes from "./http/routes";


global._console = console.log;

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
        });
    } catch (error) {
        console.error("❌ Erro ao iniciar servidor:", error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Encerrando servidor...");
    await prismaClient.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🛑 Encerrando servidor...");
    await prismaClient.$disconnect();
    process.exit(0);
});

export default app;
