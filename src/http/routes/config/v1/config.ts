import { addCompanyIdToTransaction } from "@qualitysistemas/bun-commons";
import express from "express";
import { ConfigController } from "../../../../controller/ConfigController";
import prismaClient from "../../../../database/prisma";
import { authMiddleware as checkAuth } from "../../../../middlewares/auth";

const router = express.Router();

// Rota pública para obter configurações (ex: horários de funcionamento)
router.get("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        const controller = new ConfigController(tx);
        await controller.get(req, res);
    });
});

// Rotas protegidas (apenas admin)
router.use(checkAuth);

// Atualizar configurações
router.put("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new ConfigController(tx, req.body);
        await controller.update(req, res);
    });
});

// Criar ou atualizar configurações
router.post("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new ConfigController(tx, req.body);
        await controller.upsert(req, res);
    });
});

export default router;
